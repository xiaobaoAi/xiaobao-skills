#!/usr/bin/env node
/**
 * 写入本机凭据（与 xiaobao-viral-agent 共用 ~/.xiaobao-skills/credentials.json）
 * 用法: node setup-credentials.mjs --api-key YOUR_KEY [--base-url https://apis.xiaobao.ink]
 */
import { parseArgs } from './lib/api.mjs'
import { saveCredentials, CREDENTIALS_FILE } from './lib/credentials.mjs'

const args = parseArgs()
const apiKey = String(args['api-key'] || args.api_key || args.key || '').trim()
const baseUrl = String(args['base-url'] || args.base_url || 'https://apis.xiaobao.ink').trim()

if (!apiKey) {
    console.error('用法: node setup-credentials.mjs --api-key YOUR_KEY')
    process.exit(1)
}

const file = saveCredentials({ base_url: baseUrl, api_key: apiKey })
console.log(`已写入: ${file || CREDENTIALS_FILE}`)
