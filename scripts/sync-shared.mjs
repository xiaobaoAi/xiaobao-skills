#!/usr/bin/env node
/**
 * 将 shared/xiaobao-api 同步到各 Skill 的 scripts/vendor/xiaobao-api
 * （npx skills 只装单 Skill 目录时仍自带 client，避免复制业务逻辑）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'shared', 'xiaobao-api')
const skills = ['xiaobao-viral-agent', 'xiaobao-video-agent', 'xiaobao-digital-human']

for (const name of skills) {
    const dest = path.join(root, name, 'scripts', 'vendor', 'xiaobao-api')
    fs.mkdirSync(dest, { recursive: true })
    for (const f of fs.readdirSync(src)) {
        if (!f.endsWith('.mjs')) continue
        fs.copyFileSync(path.join(src, f), path.join(dest, f))
    }
    console.log('synced →', dest)
}
