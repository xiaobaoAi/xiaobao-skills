#!/usr/bin/env node
/**
 * 本地文件 → 公网 URL（与 viral-agent 同接口 doc/49）
 * 用法: node upload.mjs --file ./sample.mp3
 */
import fs from 'node:fs'
import path from 'node:path'
import {
    parseArgs,
    printJson,
    uploadLocalFile,
    friendlyError
} from './vendor/xiaobao-api/client.mjs'

const args = parseArgs()
const input = String(args.file || args.url || args._[0] || '').trim()
const folder = args.folder ? String(args.folder) : undefined
const name = args.name ? String(args.name) : undefined

if (!input) {
    console.error('用法: node upload.mjs --file ./local.mp3  或  --url https://...')
    process.exit(1)
}

try {
    if (/^https?:\/\//i.test(input)) {
        printJson({ ok: true, url: input, source: 'remote' })
        process.exit(0)
    }
    let local = input
    if (/^file:\/\//i.test(input)) {
        try {
            local = decodeURIComponent(input.replace(/^file:\/\//i, ''))
        } catch {
            local = input.replace(/^file:\/\//i, '')
        }
    }
    const abs = path.resolve(local)
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        console.error(`文件不存在: ${abs}`)
        process.exit(1)
    }
    const uploaded = await uploadLocalFile(abs, { folder, name })
    printJson({
        ok: true,
        url: uploaded.url,
        source: 'upload',
        file_id: uploaded.file_id,
        size: uploaded.size,
        storage_remain: uploaded.storage_remain,
        local_path: uploaded.local_path
    })
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
