#!/usr/bin/env node
/**
 * 数字人视频：形象视频 + 音频 → 成片 URL（自动轮询）
 * 用法:
 *   node create-avatar.mjs --person-video https://xx.mp4 --audio-url https://xx.mp3
 *   node create-avatar.mjs --input ./avatar.json
 */
import fs from 'node:fs'
import {
    parseArgs,
    postJson,
    printJson,
    extractTaskId,
    pollCreateTask,
    ensurePublicUrl,
    friendlyError
} from './vendor/xiaobao-api/client.mjs'
import { resolveNotifyUrl } from './vendor/xiaobao-api/credentials.mjs'

const args = parseArgs()
let body = {}

if (args.input) {
    body = JSON.parse(fs.readFileSync(String(args.input), 'utf8'))
    if (body.person_video && !body.video_url) body.video_url = body.person_video
} else {
    const videoUrl = String(
        args['person-video'] || args['video-url'] || args.video_url || ''
    ).trim()
    const audioUrl = String(args['audio-url'] || args.audio_url || '').trim()
    if (!videoUrl || !audioUrl) {
        console.error(
            '用法: node create-avatar.mjs --person-video VIDEO.mp4 --audio-url AUDIO.mp3'
        )
        process.exit(1)
    }
    body = { video_url: videoUrl, audio_url: audioUrl }
}

body.notify = resolveNotifyUrl(args.notify || body.notify)

try {
    const videoUrl = await ensurePublicUrl(body.video_url || body.person_video || '')
    const audioUrl = await ensurePublicUrl(body.audio_url || '')
    if (!videoUrl || !audioUrl) {
        throw new Error('请提供形象视频与音频的公网地址或本地文件')
    }

    const resp = await postJson('/api/aihuman/create', {
        video_url: videoUrl,
        audio_url: audioUrl,
        notify: body.notify
    })
    const taskId = extractTaskId(resp)
    if (!taskId) throw new Error('数字人任务未返回编号')

    const done = await pollCreateTask(taskId)
    if (!done.video_url) throw new Error('生成完成但未拿到视频地址')

    printJson({
        ok: true,
        video_url: done.video_url,
        _internal: { task_id: taskId }
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
