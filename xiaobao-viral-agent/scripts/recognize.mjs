#!/usr/bin/env node
/**
 * 语音/视频转字幕（doc/42 系）
 * 用法:
 *   node recognize.mjs --file-url https://xx.mp4
 *   node recognize.mjs --input ./recognize.json
 *
 * 返回分段可映射为 realMan / videoPackaging 的 subtitle: [{ text }]
 */
import fs from 'node:fs'
import { parseArgs, postJson, printJson } from './lib/api.mjs'

const args = parseArgs()
let fileUrl = ''

if (args.input) {
    const body = JSON.parse(fs.readFileSync(String(args.input), 'utf8'))
    fileUrl = String(body.fileUrl || body.file_url || body.url || '').trim()
} else {
    fileUrl = String(args['file-url'] || args.fileUrl || args.url || args._[0] || '').trim()
}

if (!fileUrl) {
    console.error('用法: node recognize.mjs --file-url https://xx.mp4')
    process.exit(1)
}

try {
    const resp = await postJson('/api/xiaobao/recognition', { fileUrl })
    const raw = resp?.data
    let segments = []
    if (Array.isArray(raw)) {
        segments = raw
    } else if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw)
            segments = Array.isArray(parsed) ? parsed : []
        } catch {
            segments = []
        }
    } else if (Array.isArray(raw?.list)) {
        segments = raw.list
    }

    const subtitle = segments
        .map((s) => {
            const text = String(s?.text || s?.content || s?.word || '').trim()
            return text ? { text } : null
        })
        .filter(Boolean)

    printJson({
        ok: true,
        subtitle,
        segment_count: subtitle.length,
        response: resp,
        next: '把 subtitle 写入 examples/realMan.json 或 videoPackaging.json 后 create-task'
    })
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
