#!/usr/bin/env node
import { parseArgs, printJson } from './lib/api.mjs'
import { CREDENTIALS_FILE, saveCredentials } from './lib/credentials.mjs'

const args = parseArgs()
const apiKey = args['api-key'] || args.key || process.env.XIAOBAO_API_KEY
const baseUrl = args['base-url'] || process.env.XIAOBAO_BASE_URL || 'https://xiaoapis.com'

if (!apiKey || apiKey === true) {
    console.error(
        '用法: node setup-credentials.mjs --api-key YOUR_KEY [--base-url https://xiaoapis.com] [--notify-url https://...]'
    )
    process.exit(1)
}

const file = saveCredentials({
    base_url: baseUrl,
    api_key: String(apiKey),
    ...(args['notify-url'] ? { notify_url: String(args['notify-url']) } : {})
})
printJson({ ok: true, file, hint: '凭据已保存，请勿提交到 git' })
console.error(`已写入 ${CREDENTIALS_FILE}`)
