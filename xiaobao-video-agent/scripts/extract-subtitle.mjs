#!/usr/bin/env node
/**
 * 字幕提取：POST /api/xiaobao/recognition { fileUrl }
 * 用法: node extract-subtitle.mjs --file-url https://xx.mp4
 */
import { parseArgs, postJson, printJson } from './lib/api.mjs'
import { emptyVideoInsight, normalizeSubtitle, nullIfEmpty } from './lib/schema.mjs'

const args = parseArgs()
const fileUrl = String(args['file-url'] || args.fileUrl || args.url || args._[0] || '').trim()

if (!fileUrl) {
    console.error('用法: node extract-subtitle.mjs --file-url https://xx.mp4')
    process.exit(1)
}

try {
    const resp = await postJson('/api/xiaobao/recognition', { fileUrl })
    const subtitle = normalizeSubtitle(resp?.data)
    const insight = emptyVideoInsight()
    insight.video_url = nullIfEmpty(fileUrl)
    insight.subtitle = subtitle
    if (subtitle) {
        insight.copy = subtitle.map((s) => s.text).join('\n')
    }
    printJson({ ok: true, insight, segment_count: subtitle?.length || 0 })
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
