#!/usr/bin/env node
import { parseArgs } from './vendor/xiaobao-api/client.mjs'
import { saveCredentials, CREDENTIALS_FILE } from './vendor/xiaobao-api/credentials.mjs'

const args = parseArgs()
const apiKey = String(args['api-key'] || args.api_key || args.key || '').trim()
const baseUrl = String(args['base-url'] || args.base_url || 'https://apis.xiaobao.ink').trim()
const notifyUrl = String(args['notify-url'] || args.notify_url || '').trim()
if (!apiKey) {
    console.error(
        '用法: node setup-credentials.mjs --api-key YOUR_KEY [--notify-url https://...]'
    )
    process.exit(1)
}
saveCredentials({
    base_url: baseUrl,
    api_key: apiKey,
    ...(notifyUrl ? { notify_url: notifyUrl } : {})
})
console.log(`已写入: ${CREDENTIALS_FILE}`)
