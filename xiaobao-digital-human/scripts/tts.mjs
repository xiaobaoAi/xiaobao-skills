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
    pollTtsTask,
    pollCloneVoiceTask,
    ensurePublicUrl,
    friendlyError
} from './vendor/xiaobao-api/client.mjs'
import {
    findVoiceByName,
    loadCredentials,
    upsertVoice,
    saveCredentials,
    resolveNotifyUrl
} from './vendor/xiaobao-api/credentials.mjs'
import { defaultPublicVoice, findPublicVoice, publicVoiceNames } from './lib/public-catalog.mjs'

const args = parseArgs()

function resolveVoice(body) {
    const byName = String(args['voice-name'] || body.voice_name || '').trim()
    if (byName) {
        const saved = findVoiceByName(byName)
        if (saved) {
            return {
                voice_id: saved.voice_id,
                voice_type: saved.voice_type || 'custom',
                voice_name: saved.name
            }
        }
        const pub = findPublicVoice(byName)
        if (pub) {
            return { voice_id: pub.voice_id, voice_type: 'public', voice_name: pub.name }
        }
        throw new Error(
            `未找到名为「${byName}」的音色。可直接用公共音色：${publicVoiceNames().join('、')}。只有用户明确要自己的声音时才克隆。`
        )
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
    const fallback = defaultPublicVoice()
    return { voice_id: fallback.voice_id, voice_type: 'public', voice_name: fallback.name }
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
        const sampleUrl = await ensurePublicUrl(sample)
        const cloneResp = await postJson('/api/aihuman/clonevoice', {
            voice_url: sampleUrl,
            name,
            lang: String(args.lang || body.lang || 'zh-cn'),
            notify: resolveNotifyUrl(args.notify || body.notify)
        })
        const cloneTask = extractTaskId(cloneResp)
        if (!cloneTask) throw new Error('克隆未返回任务号')
        const cloned = await pollCloneVoiceTask(cloneTask)
        if (!cloned.voice_id) throw new Error('克隆未得到音色')
        upsertVoice({ name, voice_id: cloned.voice_id, voice_type: 'custom', sample_url: sampleUrl })
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
    const notify = resolveNotifyUrl(args.notify || body.notify)
    if (notify) payload.notify = notify

    const resp = await postJson('/api/aihuman/tts', payload)
    const taskId = extractTaskId(resp)
    if (!taskId) throw new Error('语音合成未返回任务号')

    const done = await pollTtsTask(taskId)
    const audioUrl = done.audio_url

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
        srt_url: done.srt_url,
        voice_name: voice.voice_name,
        _internal: { task_id: taskId, voice_id: voice.voice_id }
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
