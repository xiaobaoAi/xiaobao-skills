#!/usr/bin/env node
/**
 * 提交前校验智能剪辑素材（doc/25）
 * 用法: node validate-media.mjs --mode realMan --input ./payload.json
 *       node validate-media.mjs --api-type realman_broadcast --input ./payload.json
 */
import fs from 'node:fs'
import { modeToApiType, parseArgs, printJson } from './lib/api.mjs'
import { validateSmartClipMedia } from './lib/media-rules.mjs'

const args = parseArgs()
const mode = String(args.mode || '').trim()
const apiTypeArg = String(args['api-type'] || args.apiType || '').trim()
const inputPath = String(args.input || args._[0] || '').trim()
const strict = Boolean(args.strict)

if (!inputPath) {
    console.error('用法: node validate-media.mjs --mode realMan --input ./payload.json')
    process.exit(1)
}

let body
try {
    body = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
} catch (e) {
    console.error(`无法读取 JSON: ${inputPath} — ${e.message}`)
    process.exit(1)
}

const apiType = apiTypeArg || modeToApiType(mode)
const result = validateSmartClipMedia(apiType, body)
printJson({
    ok: result.ok,
    apiType,
    errors: result.errors,
    warnings: result.warnings,
    hint: '详见 references/media-requirements.md；有 errors 时不要 create'
})
if (!result.ok || (strict && result.warnings.length)) process.exit(1)
