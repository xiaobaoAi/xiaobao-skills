#!/usr/bin/env node
import fs from 'node:fs'
import {
    apiTypeToPath,
    extractTaskId,
    modeToApiType,
    parseArgs,
    postJson,
    printJson,
    whitelistBody,
    friendlyError
} from './lib/api.mjs'
import { validateSmartClipMedia } from './lib/media-rules.mjs'

const args = parseArgs()
const mode = String(args.mode || '').trim()
const apiTypeArg = String(args['api-type'] || args.apiType || '').trim()
const inputPath = String(args.input || args._[0] || '').trim()
const skipValidate = Boolean(args['skip-validate'])

if (!inputPath) {
    console.error(
        '用法: node create-task.mjs --mode realMan --input ./payload.json\n' +
            '  或: node create-task.mjs --api-type realman_broadcast --input ./payload.json'
    )
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
const path = apiTypeToPath(apiType)
const payload = whitelistBody(apiType, body)

if (!skipValidate) {
    const checked = validateSmartClipMedia(apiType, payload)
    for (const w of checked.warnings) {
        console.error(`[media warning] ${w}`)
    }
    if (!checked.ok) {
        printJson({
            ok: false,
            error: 'media_requirements',
            message: '素材不符合智能剪辑要求，已阻止提交。请按 references/media-requirements.md 调整后重试。',
            errors: checked.errors,
            warnings: checked.warnings
        })
        process.exit(1)
    }
}

try {
    const resp = await postJson(path, payload, { action: 'create' })
    const taskId = extractTaskId(resp)
    printJson({
        ok: true,
        mode: mode || null,
        apiType,
        task_id: taskId || null,
        response: resp
    })
    if (!taskId) {
        console.error('警告: 响应中未解析到 task_id，请检查 response')
        process.exitCode = 2
    }
} catch (e) {
    console.error(friendlyError(e))
    process.exit(1)
}
