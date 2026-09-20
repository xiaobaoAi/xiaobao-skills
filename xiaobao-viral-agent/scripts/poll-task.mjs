#!/usr/bin/env node
/**
 * 轮询智能剪辑任务（统一查询接口 doc/46）
 * 用法:
 *   node poll-task.mjs --task-id TASK_ID
 *   node poll-task.mjs --task-id TASK_ID --once
 *   node poll-task.mjs --mode realMan --task-id TASK_ID   # mode 仅兼容旧调用，查询不需要
 */
import {
    modeToApiType,
    parseArgs,
    printJson,
    pollSmartClipTask,
    querySmartClipTask,
    interpretSmartClipQuery,
    friendlyError
} from './lib/api.mjs'

const args = parseArgs()
const taskId = String(args['task-id'] || args.taskId || args._[0] || '').trim()
const mode = String(args.mode || '').trim()
const apiTypeHint = String(
    args['api-type'] || args.apiType || (mode ? modeToApiType(mode) : '') || ''
).trim()
const intervalMs = Math.max(2000, Number(args.interval || 3000) || 3000)
const maxAttempts = Math.max(1, Number(args.attempts || 60) || 60)
const once = Boolean(args.once)

if (!taskId) {
    console.error('用法: node poll-task.mjs --task-id TASK_ID')
    process.exit(1)
}

try {
    if (once) {
        const resp = await querySmartClipTask(taskId)
        const viewed = interpretSmartClipQuery(resp)
        printJson({
            ok: viewed.state !== 'fail',
            task_id: taskId,
            apiType: viewed.api_type || apiTypeHint || null,
            status: viewed.status || null,
            progress: viewed.progress ?? null,
            result_url: viewed.video_url || null,
            error: viewed.state === 'fail' ? viewed.message : null,
            response: resp
        })
        process.exit(viewed.state === 'fail' ? 1 : 0)
    }

    const done = await pollSmartClipTask(taskId, { intervalMs, attempts: maxAttempts })
    printJson({
        ok: true,
        done: true,
        task_id: done.task_id || taskId,
        apiType: done.api_type || apiTypeHint || null,
        status: done.status,
        progress: done.progress,
        result_url: done.video_url,
        cover_url: done.cover_url,
        attempts: done.attempts,
        response: done.response
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
