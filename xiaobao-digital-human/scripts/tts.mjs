#!/usr/bin/env node
/**
 * TTS：文案 → 音频 URL（自动轮询）
 * 用法（优先用人话音色名，不要求用户知 voice_id）:
 *   node tts.mjs --text "你好" --voice-name 我的音色
 *   node tts.mjs --text "你好" --audio-url https://sample.mp3   # 先克隆再合成
 *   node tts.mjs --input ./tts.json
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
import {
    findVoiceByName,
    loadCredentials,
    upsertVoice,
    saveCredentials
} from './vendor/xiaobao-api/credentials.mjs'

const args = parseArgs()

function resolveVoice(body) {
    const byName = String(args['voice-name'] || body.voice_name || '').trim()
    if (byName) {
        const found = findVoiceByName(byName)
        if (!found) throw new Error(`未找到名为「${byName}」的音色，请先克隆声音或换一个名称`)
        return { voice_id: found.voice_id, voice_type: found.voice_type || 'custom', voice_name: found.name }
    }
    const id = String(args['voice-id'] || body.voice_id || '').trim()
    if (id) {
        return {
            voice_id: id,
            voice_type: String(args['voice-type'] || body.voice_type || 'custom'),
            voice_name: null
        }
    }
    const cred = loadCredentials()
    if (cred.default_voice_id) {
        return {
            voice_id: cred.default_voice_id,
            voice_type: cred.default_voice_type || 'custom',
            voice_name: '默认音色'
        }
    }
    throw new Error('请指定音色：--voice-name 已克隆名称，或先 --audio-url 克隆，或配置默认音色')
}

try {
    let text = ''
    let body = {}
    if (args.input) {
        body = JSON.parse(fs.readFileSync(String(args.input), 'utf8'))
        text = String(body.text || '').trim()
    } else {
        text = String(args.text || '').trim()
    }
    if (!text) {
        console.error('用法: node tts.mjs --text "文案" --voice-name 我的音色')
        process.exit(1)
    }

    // 可选：边克隆边合成
    const sample = String(args['audio-url'] || args['voice-url'] || body.sample_url || '').trim()
    if (sample) {
        const name = String(args['voice-name'] || args.name || '临时音色')
        const cloneResp = await postJson('/api/aihuman/clonevoice', {
            voice_url: sample,
            name,
            lang: String(args.lang || body.lang || 'zh-cn')
        })
        const cloneTask = extractTaskId(cloneResp)
        if (!cloneTask) throw new Error('克隆未返回任务号')
        const cloned = await pollAihumanTask(cloneTask, 'voice')
        if (!cloned.voice_id) throw new Error('克隆未得到音色')
        upsertVoice({ name, voice_id: cloned.voice_id, voice_type: 'custom', sample_url: sample })
        body.voice_id = cloned.voice_id
        body.voice_type = 'custom'
        body.voice_name = name
    }

    const voice = resolveVoice(body)
    const payload = {
        text,
        voice_id: voice.voice_id,
        voice_type: voice.voice_type,
        speed: Number(args.speed || body.speed || 1),
        volume: Number(args.volume || body.volume || 1),
        lang: String(args.lang || body.lang || 'zh-cn')
    }
    const notify = String(args.notify || body.notify || '').trim()
    if (notify) payload.notify = notify

    const resp = await postJson('/api/aihuman/tts', payload)
    const taskId = extractTaskId(resp)
    if (!taskId) throw new Error('语音合成未返回任务号')

    const done = await pollAihumanTask(taskId, 'voice')
    const audioUrl = done.result_url
    if (!audioUrl) throw new Error('合成完成但未拿到音频地址')

    // 记住默认音色（可选）
    if (args['set-default']) {
        const c = loadCredentials()
        saveCredentials({
            base_url: c.base_url,
            api_key: c.api_key,
            default_voice_id: voice.voice_id,
            default_voice_type: voice.voice_type
        })
    }

    printJson({
        ok: true,
        audio_url: audioUrl,
        voice_name: voice.voice_name,
        _internal: { task_id: taskId, voice_id: voice.voice_id }
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
