#!/usr/bin/env node
/**
 * 视频文案提取（doc/28 系）POST /api/video/text
 * 用法:
 *   node extract-copy.mjs --url "分享链接或视频URL"
 *   node extract-copy.mjs --task-id TASK_ID   # 仅查询
 */
import { parseArgs, postForm, printJson, sleep } from './lib/api.mjs'
import { emptyVideoInsight, nullIfEmpty } from './lib/schema.mjs'

const args = parseArgs()
const url = String(args.url || args.content || args._[0] || '').trim()
const onlyTask = String(args['task-id'] || args.taskId || '').trim()
const intervalMs = Math.max(2000, Number(args.interval || 3000) || 3000)
const maxAttempts = Math.max(1, Number(args.attempts || 40) || 40)

function unwrapData(result) {
    let data = result?.data
    if (typeof data === 'string' && data) {
        try {
            data = JSON.parse(data)
        } catch {
            return { taskId: data }
        }
    }
    return data && typeof data === 'object' ? data : {}
}

function extractTaskId(result) {
    const data = unwrapData(result)
    const c = [
        data.taskId,
        data.task_id,
        data.taskid,
        result?.taskId,
        result?.task_id,
        result?.taskid
    ]
    for (const v of c) {
        if (v != null && String(v).trim()) return String(v).trim()
    }
    return ''
}

function parseText(data) {
    const candidates = [
        data.resultText,
        data.result_text,
        data.text,
        data.copy,
        data.copy_text,
        data.result,
        data.content,
        data.oral,
        data.asr_text
    ]
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c.trim()
        if (Array.isArray(c)) {
            const joined = c
                .map((x) => (typeof x === 'string' ? x : x?.text || ''))
                .filter(Boolean)
                .join('\n')
            if (joined) return joined
        }
    }
    return ''
}

function isProcessing(status) {
    const s = String(status || '').toLowerCase()
    return ['', 'pending', 'processing', 'running', 'queue', 'queued', '0', '1'].includes(s)
}

function toInsight(data, text) {
    const insight = emptyVideoInsight()
    insight.copy = nullIfEmpty(text)
    insight.title = nullIfEmpty(data.title)
    insight.description = nullIfEmpty(data.videoDesc || data.video_desc || data.desc)
    insight.duration = nullIfEmpty(data.duration)
    return insight
}

function isFail(status, msg) {
    const s = String(status || '').toLowerCase()
    if (['failed', 'fail', 'error', '3'].includes(s)) return true
    if (/失败|错误/.test(String(msg || ''))) return true
    return false
}

async function queryOnce(taskId) {
    return postForm('/api/video/text', { taskId })
}

async function submit(content) {
    return postForm('/api/video/text', { content })
}

try {
    let result
    let taskId = onlyTask

    if (taskId) {
        result = await queryOnce(taskId)
        const data = unwrapData(result)
        const text = parseText(data) || parseText(result)
        if (text) {
            printJson({ ok: true, insight: toInsight(data, text), task_id: taskId })
            process.exit(0)
        }
    } else {
        if (!url) {
            console.error('用法: node extract-copy.mjs --url "视频链接"')
            process.exit(1)
        }
        result = await submit(url)
        taskId = extractTaskId(result)
        const data0 = unwrapData(result)
        const text0 = parseText(data0) || parseText(result)
        const status0 = data0.status || result.status
        if (text0) {
            printJson({ ok: true, insight: toInsight(data0, text0), task_id: taskId || null })
            process.exit(0)
        }
        if (!isProcessing(status0)) {
            throw new Error(result?.msg || result?.message || '文案提取未返回文案')
        }
        if (!taskId) {
            throw new Error(
                result?.msg || result?.message || '文案提取未返回任务号，请换链接重试'
            )
        }
    }

    for (let i = 1; i <= maxAttempts; i++) {
        result = await queryOnce(taskId)
        const data = unwrapData(result)
        const text = parseText(data) || parseText(result)
        const status = data.status || result.status
        const msg = result.msg || result.message || data.message || ''

        if (text) {
            printJson({ ok: true, insight: toInsight(data, text), task_id: taskId, attempts: i })
            process.exit(0)
        }
        if (isFail(status, msg) || !isProcessing(status)) {
            throw new Error(msg || '文案提取失败')
        }
        console.error(`[extract-copy ${i}/${maxAttempts}] ${status || 'processing'}…`)
        await sleep(intervalMs)
    }
    throw new Error('文案提取超时，请稍后重试')
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
