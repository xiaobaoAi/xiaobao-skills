#!/usr/bin/env node
/**
 * 视频理解总入口 → 统一 insight JSON
 * 用法:
 *   node analyze-video.mjs --url "链接" [--intent analyze|copy|subtitle|cover|structure]
 *   --with-copy / --with-subtitle  在 analyze 时追加能力
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, printJson, isDirectMediaUrl } from './lib/api.mjs'
import {
    emptyVideoInsight,
    mergeInsight,
    inferStructure,
    nullIfEmpty
} from './lib/schema.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = parseArgs()
const url = String(args.url || args.link || args._[0] || '').trim()
const intent = String(args.intent || 'analyze').trim().toLowerCase()
const withCopy = Boolean(args['with-copy'] || args.withCopy || intent === 'copy' || intent === 'analyze')
const withSubtitle = Boolean(
    args['with-subtitle'] || args.withSubtitle || intent === 'subtitle' || intent === 'structure'
)
const wantCoverOnly = intent === 'cover'
const wantStructure = intent === 'structure' || intent === 'analyze'

if (!url) {
    console.error(
        '用法: node analyze-video.mjs --url "视频链接" [--intent analyze|copy|subtitle|cover|structure]'
    )
    process.exit(1)
}

function runScript(name, extraArgs) {
    return new Promise((resolve, reject) => {
        const script = path.join(__dirname, name)
        const child = spawn(process.execPath, [script, ...extraArgs], {
            stdio: ['ignore', 'pipe', 'pipe']
        })
        let out = ''
        let err = ''
        child.stdout.on('data', (d) => {
            out += d
        })
        child.stderr.on('data', (d) => {
            err += d
        })
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(err.trim() || out.trim() || `${name} failed`))
                return
            }
            try {
                // 取最后一段 JSON（忽略 stderr 进度）
                const start = out.indexOf('{')
                const json = start >= 0 ? out.slice(start) : out
                resolve(JSON.parse(json))
            } catch (e) {
                reject(new Error(`${name} 输出无法解析 JSON: ${e.message}`))
            }
        })
    })
}

try {
    let insight = emptyVideoInsight()
    let meta = { intent, steps: [] }

    if (wantCoverOnly) {
        const r = await runScript('extract-cover.mjs', ['--url', url])
        insight = mergeInsight(insight, r.insight)
        meta.steps.push('cover')
        printJson({ ok: true, insight, meta })
        process.exit(0)
    }

    if (intent === 'copy' && !args['with-parse']) {
        const r = await runScript('extract-copy.mjs', ['--url', url])
        insight = mergeInsight(insight, r.insight)
        meta.steps.push('copy')
        printJson({ ok: true, insight, meta })
        process.exit(0)
    }

    // 1) 解析 / 直链
    const parsed = await runScript('parse-video.mjs', ['--url', url])
    insight = mergeInsight(insight, parsed.insight)
    meta.steps.push('parse')
    meta.platform = parsed.platform || null
    meta.type = parsed.type || null

    const mediaUrl = insight.video_url || (isDirectMediaUrl(url) ? url : null)

    // 2) 文案
    if (withCopy || intent === 'copy') {
        try {
            const r = await runScript('extract-copy.mjs', ['--url', url])
            insight = mergeInsight(insight, {
                copy: r.insight?.copy,
                title: insight.title || r.insight?.title,
                description: insight.description || r.insight?.description,
                duration: insight.duration ?? r.insight?.duration
            })
            meta.steps.push('copy')
        } catch (e) {
            meta.copy_error = e.message
        }
    }

    // 3) 字幕（需要可访问的视频直链）
    if ((withSubtitle || intent === 'subtitle' || wantStructure) && mediaUrl) {
        try {
            const r = await runScript('extract-subtitle.mjs', ['--file-url', mediaUrl])
            insight = mergeInsight(insight, {
                subtitle: r.insight?.subtitle,
                copy: insight.copy || r.insight?.copy
            })
            meta.steps.push('subtitle')
        } catch (e) {
            meta.subtitle_error = e.message
        }
    } else if (intent === 'subtitle' && !mediaUrl) {
        throw new Error('无法取得视频直链，暂不能提取字幕。请换公开分享链接或直接提供 mp4 地址。')
    }

    // 4) 结构
    if (wantStructure) {
        const structure = inferStructure({
            title: insight.title,
            copy: insight.copy,
            subtitle: insight.subtitle
        })
        if (structure) {
            const materials = Array.isArray(insight.materials) ? [...insight.materials] : []
            materials.push(structure)
            insight.materials = materials
            meta.steps.push('structure')
        }
    }

    // cover-only path already exited; for analyze ensure cover from parse kept
    if (intent === 'cover') {
        /* unreachable */
    }

    // 规范化 null
    for (const k of Object.keys(emptyVideoInsight())) {
        if (insight[k] === undefined) insight[k] = null
        if (typeof insight[k] === 'string' && insight[k].trim() === '') insight[k] = null
    }

    printJson({ ok: true, insight, meta })
} catch (e) {
    console.error(e.message || e)
    process.exit(1)
}
