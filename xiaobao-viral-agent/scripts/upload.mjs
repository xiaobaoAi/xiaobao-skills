#!/usr/bin/env node
/**
 * 素材 URL 就绪检查。
 * 开放平台剪辑接口需要公网可访问 URL；本脚本不做私有上传（避免替客户托管文件）。
 * - 若入参已是 http(s) URL：原样返回
 * - 若是本地路径：报错并提示先上传到可访问存储
 */
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs, printJson } from './lib/api.mjs'

const args = parseArgs()
const input = String(args.file || args.url || args._[0] || '').trim()

if (!input) {
    console.error('用法: node upload.mjs --url https://...  或  node upload.mjs --file ./local.mp4')
    process.exit(1)
}

if (/^https?:\/\//i.test(input)) {
    printJson({ ok: true, url: input, source: 'remote' })
    process.exit(0)
}

const abs = path.resolve(input)
if (!fs.existsSync(abs)) {
    console.error(`文件不存在: ${abs}`)
    process.exit(1)
}

printJson({
    ok: false,
    error: 'local_file_needs_public_url',
    path: abs,
    message:
        '剪辑 API 需要公网可访问的 fileUrl/videoUrl/audioUrl。请先将本地文件上传到对象存储或可访问 CDN，再把 https URL 传给 create-task。'
})
process.exit(2)
