#!/usr/bin/env node
/**
 * 查询异步任务（内部排障用；正常流程用 tts/clone-voice/create-avatar 内置轮询）
 * 用法: node query-task.mjs --type tts|clone|video|avatar --task-id TASK_ID [--poll]
 */
import {
    parseArgs,
    printJson,
    queryTtsTask,
    queryCloneVoiceTask,
    queryCreateTask,
    pollTtsTask,
    pollCloneVoiceTask,
    pollCreateTask,
    friendlyError
} from './vendor/xiaobao-api/client.mjs'

const args = parseArgs()
const taskId = String(args['task-id'] || args.taskId || args._[0] || '').trim()
const type = String(args.type || 'video').trim()
const doPoll = Boolean(args.poll)

if (!taskId) {
    console.error('用法: node query-task.mjs --type tts|clone|video|avatar --task-id TASK_ID [--poll]')
    process.exit(1)
}

try {
    if (type === 'tts') {
        if (doPoll) {
            const done = await pollTtsTask(taskId)
            printJson({
                ok: true,
                audio_url: done.audio_url,
                srt_url: done.srt_url,
                _internal: { task_id: taskId, type }
            })
        } else {
            const resp = await queryTtsTask(taskId)
            const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
            printJson({
                ok: true,
                status: data.status ?? null,
                audio_url: data.audio_url || null,
                srt_url: data.srt_url || null,
                fail_reason: data.fail_reason || null,
                _internal: { task_id: taskId, type }
            })
        }
    } else if (type === 'clone' || type === 'clonevoice' || type === 'voice') {
        if (doPoll) {
            const done = await pollCloneVoiceTask(taskId)
            printJson({
                ok: true,
                voice_id: done.voice_id,
                voice_name: done.name,
                demo_url: done.demo_url,
                _internal: { task_id: taskId, type: 'clone' }
            })
        } else {
            const resp = await queryCloneVoiceTask(taskId)
            const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
            printJson({
                ok: true,
                status: data.status ?? null,
                voice_id: data.voice_id || null,
                voice_name: data.name || null,
                demo_url: data.demo_url || null,
                fail_reason: data.fail_reason || null,
                _internal: { task_id: taskId, type: 'clone' }
            })
        }
    } else if (type === 'video' || type === 'avatar' || type === 'create') {
        if (doPoll) {
            const done = await pollCreateTask(taskId)
            printJson({
                ok: true,
                video_url: done.video_url,
                video_time: done.video_time,
                _internal: { task_id: taskId, type: 'video' }
            })
        } else {
            const resp = await queryCreateTask(taskId)
            const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
            printJson({
                ok: true,
                status: data.status ?? null,
                video_url: data.video_url || null,
                video_time: data.video_time ?? null,
                fail_reason: data.fail_reason || null,
                _internal: { task_id: taskId, type: 'video' }
            })
        }
    } else {
        throw new Error('type 只能是 tts、clone、video')
    }
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
