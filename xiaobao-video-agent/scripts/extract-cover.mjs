#!/usr/bin/env node
/**
 * 封面提取：优先走 videoparse，取出 cover_url
 * 用法: node extract-cover.mjs --url "分享链接"
 */
import { parseArgs, postJson, printJson, isDirectMediaUrl } from './lib/api.mjs'
import { fromParseData, emptyVideoInsight } from './lib/schema.mjs'

const args = parseArgs()
const url = String(args.url || args.link || args._[0] || '').trim()

if (!url) {
    console.error('用法: node extract-cover.mjs --url "https://v.douyin.com/..."')
    process.exit(1)
}

try {
    if (isDirectMediaUrl(url)) {
        const insight = emptyVideoInsight()
        insight.video_url = url
        printJson({
            ok: true,
            insight,
            note: '直链无法从解析接口取封面；请提供平台分享链接，或自行截帧上传'
        })
        process.exit(0)
    }

    const resp = await postJson('/api/video/videoparse', {
        url,
        content: url,
        link: url,
        flat: 2
    })
    const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
    const full = fromParseData(data)
    const insight = emptyVideoInsight()
    insight.cover_url = full.cover_url
    insight.video_url = full.video_url
    insight.title = full.title
    if (insight.cover_url) {
        insight.materials = [{ type: 'image', fileUrl: insight.cover_url, role: 'cover' }]
    }
    printJson({ ok: true, insight })
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
