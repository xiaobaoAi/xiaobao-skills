#!/usr/bin/env node
/**
 * 全平台视频解析（doc/43）POST /api/video/videoparse
 * 用法: node parse-video.mjs --url "分享链接或口令"
 */
import { parseArgs, postJson, printJson, isDirectMediaUrl } from './lib/api.mjs'
import { fromParseData, emptyVideoInsight, nullIfEmpty } from './lib/schema.mjs'

const args = parseArgs()
const url = String(args.url || args.link || args.content || args._[0] || '').trim()

if (!url) {
    console.error('用法: node parse-video.mjs --url "https://v.douyin.com/..."')
    process.exit(1)
}

try {
    if (isDirectMediaUrl(url)) {
        const insight = emptyVideoInsight()
        insight.video_url = url
        insight.materials = [{ type: 'video', fileUrl: url }]
        printJson({
            ok: true,
            source: 'direct_media',
            insight,
            note: '直链媒体未走平台解析；封面/标题可能为空，可再跑 extract-copy / extract-subtitle'
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
    const insight = fromParseData(data)
    if (!insight.video_url && nullIfEmpty(url)) {
        // 图文笔记可能无 video_url
    }
    printJson({
        ok: true,
        source: 'videoparse',
        platform: data.platform || null,
        type: data.type || null,
        insight,
        raw: data
    })
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
