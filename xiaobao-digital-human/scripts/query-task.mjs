#!/usr/bin/env node
/**
 * 查询异步任务（内部排障用；正常流程用 tts/create-avatar 内置轮询）
 * 用法: node query-task.mjs --type voice|video|avatar --task-id TASK_ID [--poll]
 */
import {
    parseArgs,
    printJson,
    queryAihumanTask,
    pollAihumanTask,
    extractResultUrl,
    extractVoiceId,
    extractStatus,
    friendlyError
} from './vendor/xiaobao-api/client.mjs'

const args = parseArgs()
const taskId = String(args['task-id'] || args.taskId || args._[0] || '').trim()
const type = String(args.type || 'video').trim()
const doPoll = Boolean(args.poll)

if (!taskId) {
    console.error('用法: node query-task.mjs --type voice --task-id TASK_ID [--poll]')
    process.exit(1)
}

try {
    if (doPoll) {
        const done = await pollAihumanTask(taskId, type)
        printJson({
            ok: true,
            result_url: done.result_url,
            voice_id: done.voice_id,
            _internal: { task_id: taskId, type }
        })
    } else {
        const resp = await queryAihumanTask(taskId, type)
        printJson({
            ok: true,
            status: extractStatus(resp),
            result_url: extractResultUrl(resp) || null,
            voice_id: extractVoiceId(resp) || null,
            _internal: { task_id: taskId, type, response: resp }
        })
    }
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
