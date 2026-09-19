#!/usr/bin/env node
/**
 * 声音克隆 → 轮询 → 保存音色别名（对用户只展示名称）
 * 用法:
 *   node clone-voice.mjs --audio-url https://xx.mp3 --name 我的音色
 *   node clone-voice.mjs --input ./clone.json
 */
import fs from 'node:fs'
import {
    parseArgs,
    postJson,
    printJson,
    extractTaskId,
    pollAihumanTask,
    friendlyError
} from './vendor/xiaobao-api/client.mjs'
import { upsertVoice } from './vendor/xiaobao-api/credentials.mjs'

const args = parseArgs()
let body = {}
let displayName = '我的音色'

if (args.input) {
    body = JSON.parse(fs.readFileSync(String(args.input), 'utf8'))
    displayName = String(body.name || displayName)
} else {
    const audioUrl = String(args['audio-url'] || args['voice-url'] || args.url || '').trim()
    if (!audioUrl) {
        console.error('用法: node clone-voice.mjs --audio-url https://xx.mp3 --name 我的音色')
        process.exit(1)
    }
    displayName = String(args.name || '我的音色')
    body = {
        voice_url: audioUrl,
        name: displayName,
        lang: String(args.lang || 'zh-cn')
    }
    const notify = String(args.notify || '').trim()
    if (notify) body.notify = notify
}

try {
    const resp = await postJson('/api/aihuman/clonevoice', body)
    const taskId = extractTaskId(resp)
    if (!taskId) throw new Error('克隆任务未返回编号，请稍后重试')

    const done = await pollAihumanTask(taskId, 'voice')
    const voiceId = done.voice_id
    if (!voiceId) throw new Error('克隆完成但未拿到音色，请换一段清晰人声样本重试')

    const saved = upsertVoice({
        name: displayName,
        voice_id: voiceId,
        voice_type: 'custom',
        sample_url: body.voice_url || ''
    })

    printJson({
        ok: true,
        voice_name: saved.name,
        sample_url: saved.sample_url || null,
        // 内部字段仅供排障；Agent 对用户应只说「音色名称」
        _internal: { voice_id: voiceId, task_id: taskId }
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
