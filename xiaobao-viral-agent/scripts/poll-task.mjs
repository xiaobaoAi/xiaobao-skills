#!/usr/bin/env node
import {
    apiTypeToPath,
    extractResultUrl,
    extractStatus,
    formatApiError,
    modeToApiType,
    parseArgs,
    postJson,
    printJson
} from './lib/api.mjs'

const args = parseArgs()
const taskId = String(args['task-id'] || args.taskId || args._[0] || '').trim()
const mode = String(args.mode || '').trim()
const apiType = String(args['api-type'] || args.apiType || (mode ? modeToApiType(mode) : '') || 'realman_broadcast').trim()
const intervalMs = Math.max(2000, Number(args.interval || 5000) || 5000)
const maxAttempts = Math.max(1, Number(args.attempts || 60) || 60)
const once = Boolean(args.once)

if (!taskId) {
    console.error('用法: node poll-task.mjs --api-type realman_broadcast --task-id TASK_ID')
    process.exit(1)
}

const path = apiTypeToPath(apiType)

function isTerminalSuccess(status, url) {
    if (url) return true
    const s = String(status ?? '').toLowerCase()
    return s === '2' || s === 'success' || s === 'succeed' || s === 'done' || s === 'completed'
}

function isTerminalFail(status, resp) {
    const s = String(status ?? '').toLowerCase()
    if (s === '3' || s === 'fail' || s === 'failed' || s === 'error') return true
    const code = resp?.code
    if (code === 0 && resp?.msg && /失败|错误|fail/i.test(String(resp.msg)) && !resp?.data) {
        return true
    }
    return false
}

async function tick() {
    const resp = await postJson(path, { task_id: taskId }, { action: 'query' })
    const status = extractStatus(resp)
    const url = extractResultUrl(resp)
    return { resp, status, url }
}

try {
    if (once) {
        const { resp, status, url } = await tick()
        printJson({ ok: true, task_id: taskId, apiType, status, result_url: url || null, response: resp })
        process.exit(0)
    }

    for (let i = 1; i <= maxAttempts; i++) {
        const { resp, status, url } = await tick()
        const failMsg = formatApiError(resp, '')
        if (isTerminalSuccess(status, url)) {
            printJson({
                ok: true,
                done: true,
                task_id: taskId,
                apiType,
                status,
                result_url: url || null,
                attempts: i,
                response: resp
            })
            process.exit(0)
        }
        if (isTerminalFail(status, resp)) {
            printJson({
                ok: false,
                done: true,
                task_id: taskId,
                apiType,
                status,
                error: failMsg || '任务失败',
                attempts: i,
                response: resp
            })
            process.exit(1)
        }
        console.error(`[poll ${i}/${maxAttempts}] status=${status ?? 'pending'} …`)
        await new Promise((r) => setTimeout(r, intervalMs))
    }
    console.error(`超时：已轮询 ${maxAttempts} 次仍未终态`)
    process.exit(1)
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
