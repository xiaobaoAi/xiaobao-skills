#!/usr/bin/env node
/**
 * 一句话口播：文案 + 人物视频 →（可选克隆）TTS → 数字人视频
 * 用法:
 *   node speak.mjs --text "大家好" --person-video https://xx.mp4 --voice-name 我的音色
 *   node speak.mjs --text "大家好" --person-video https://xx.mp4 --audio-url https://sample.mp3 --name 老板
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, printJson, friendlyError } from './vendor/xiaobao-api/client.mjs'
import { publicAvatarNames, resolveAvatarUrl } from './lib/public-catalog.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = parseArgs()

const text = String(args.text || '').trim()
const voiceHint = String(args['voice-name'] || args.name || '').trim()
const personRaw = String(args['person-video'] || args['video-url'] || '').trim()
const personVideo = resolveAvatarUrl(personRaw, voiceHint || '热情娜娜')

if (!text || !personVideo) {
    console.error(
        `用法: node speak.mjs --text "文案" [--voice-name 热情娜娜] [--person-video 年轻女性商务]\n公共形象：${publicAvatarNames().join('、')}`
    )
    process.exit(1)
}

function run(script, extra) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(__dirname, script), ...extra], {
            stdio: ['ignore', 'pipe', 'pipe']
        })
        let out = ''
        let err = ''
        child.stdout.on('data', (d) => {
            out += d
        })
        child.stderr.on('data', (d) => {
            err += d
        })
        child.on('close', (code) => {
            if (code !== 0) return reject(new Error(err.trim() || out.trim() || script))
            const i = out.indexOf('{')
            try {
                resolve(JSON.parse(i >= 0 ? out.slice(i) : out))
            } catch (e) {
                reject(e)
            }
        })
    })
}

try {
    const ttsArgs = ['--text', text]
    if (voiceHint) ttsArgs.push('--voice-name', voiceHint)
    else if (!args['audio-url'] && !args['voice-url'] && !args['voice-id']) {
        ttsArgs.push('--voice-name', '热情娜娜')
    }
    if (args['audio-url'] || args['voice-url']) {
        ttsArgs.push('--audio-url', String(args['audio-url'] || args['voice-url']))
    }
    if (args['voice-id']) ttsArgs.push('--voice-id', String(args['voice-id']))

    const tts = await run('tts.mjs', ttsArgs)
    const audioUrl = tts.audio_url
    if (!audioUrl) throw new Error('未拿到配音地址')

    const avatar = await run('create-avatar.mjs', [
        '--person-video',
        personVideo,
        '--audio-url',
        audioUrl
    ])
    if (!avatar.video_url) throw new Error('未拿到数字人视频')

    printJson({
        ok: true,
        audio_url: audioUrl,
        video_url: avatar.video_url,
        voice_name: tts.voice_name || voiceHint || '热情娜娜',
        person: personRaw || null,
        next: '可将 video_url 交给 xiaobao-viral-agent 做模版混剪/包装'
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
