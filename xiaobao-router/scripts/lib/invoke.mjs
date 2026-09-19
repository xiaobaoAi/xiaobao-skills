import { spawn } from 'node:child_process'
import { fail, ok, isEnvelope } from './protocol.mjs'

export function runNode(script, args, { timeoutMs = 15 * 60 * 1000 } = {}) {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, [script, ...args], {
            stdio: ['ignore', 'pipe', 'pipe']
        })
        let out = ''
        let err = ''
        const timer = setTimeout(() => {
            child.kill('SIGTERM')
        }, timeoutMs)
        child.stdout.on('data', (d) => {
            out += d
        })
        child.stderr.on('data', (d) => {
            err += d
        })
        child.on('close', (code) => {
            clearTimeout(timer)
            const start = out.indexOf('{')
            let parsed = null
            if (start >= 0) {
                try {
                    parsed = JSON.parse(out.slice(start))
                } catch {
                    parsed = null
                }
            }
            if (code !== 0) {
                const fromBody =
                    (typeof parsed?.error === 'string' && parsed.error) ||
                    parsed?.error?.message ||
                    parsed?.msg ||
                    ''
                resolve(
                    fail(err.trim() || fromBody || '技能执行失败', 'SKILL_FAILED', {
                        stderr: err.trim().slice(0, 500)
                    })
                )
                return
            }
            if (!parsed) {
                resolve(fail('技能没有返回 JSON', 'BAD_OUTPUT'))
                return
            }
            if (isEnvelope(parsed)) {
                resolve(parsed)
                return
            }
            resolve(ok(parsed))
        })
    })
}

/** 把各 Skill 现有 stdout 收成协议 data，不改它们的脚本 */
export function adapt(skill, rawEnvelope, purpose = 'result') {
    if (!rawEnvelope?.success) return rawEnvelope
    if (purpose === 'raw') return rawEnvelope
    const raw = rawEnvelope.data || {}
    const insight = raw.insight || raw

    if (skill === 'xiaobao-video-agent') {
        return ok({
            copy: insight.copy ?? null,
            subtitle: insight.subtitle ?? null,
            cover_url: insight.cover_url ?? null,
            video_url: insight.video_url ?? null,
            title: insight.title ?? null,
            description: insight.description ?? null,
            materials: insight.materials ?? null
        })
    }
    if (skill === 'xiaobao-digital-human') {
        return ok({
            audio_url: raw.audio_url || insight.audio_url || null,
            video_url: raw.video_url || insight.video_url || null,
            voice_name: raw.voice_name || null,
            voice_id: raw._internal?.voice_id || raw.voice_id || null
        })
    }
    if (skill === 'xiaobao-viral-agent') {
        const response = raw.response || raw
        const video =
            raw.result_url ||
            raw.video_url ||
            response?.data?.video_url ||
            response?.data?.url ||
            null
        return ok({
            video_url: video,
            task_id: raw.task_id || response?.data?.task_id || null,
            status: raw.done ? 'completed' : raw.status || (video ? 'completed' : 'unknown')
        })
    }
    return rawEnvelope
}
