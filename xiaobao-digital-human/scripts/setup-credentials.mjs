#!/usr/bin/env node
import { parseArgs } from './vendor/xiaobao-api/client.mjs'
import { saveCredentials, CREDENTIALS_FILE } from './vendor/xiaobao-api/credentials.mjs'

const args = parseArgs()
const apiKey = String(args['api-key'] || args.api_key || args.key || '').trim()
const baseUrl = String(args['base-url'] || args.base_url || 'https://apis.xiaobao.ink').trim()
if (!apiKey) {
    console.error('用法: node setup-credentials.mjs --api-key YOUR_KEY')
    process.exit(1)
}
saveCredentials({ base_url: baseUrl, api_key: apiKey })
console.log(`已写入: ${CREDENTIALS_FILE}`)
