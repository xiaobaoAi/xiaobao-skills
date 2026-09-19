#!/usr/bin/env node
import { parseArgs, postJson, printJson } from './lib/api.mjs'

const args = parseArgs()
const scene = String(args.scene || 'realMan').trim()
const pageSize = Number(args.pageSize || args['page-size'] || 20)

try {
    const data = await postJson('/api/smartclip/template', {
        scene,
        pageSize: Number.isFinite(pageSize) ? pageSize : 20
    })
    printJson(data)
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
