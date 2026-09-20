/**
 * 智能剪辑素材约束（doc/25）。提交前做扩展名/已知大小检查，提高成功率。
 * 时长、编码、分辨率无法从 URL 可靠读取时，返回 warnings 供 Agent 追问。
 */
import fs from 'node:fs'
import path from 'node:path'

const VIDEO_EXT = new Set(['mp4', 'mov'])
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const COVER_EXT = new Set(['jpg', 'jpeg', 'png'])
const AUDIO_EXT = new Set(['mp3', 'wav', 'm4a'])

const LIMITS = {
    videoUrlBytes: 500 * 1024 * 1024,
    materialVideoBytes: 500 * 1024 * 1024,
    audioBytes: 120 * 1024 * 1024,
    coverBytes: 10 * 1024 * 1024,
    materialVideoSeconds: 60,
    totalMaterialSeconds: 300,
    imageSeconds: 2,
    videoUrlSeconds: 300
}

function extOf(url) {
    const s = String(url || '').trim()
    if (!s) return ''
    try {
        const u = new URL(s)
        const base = path.basename(u.pathname || '')
        const m = /\.([a-z0-9]+)$/i.exec(base)
        return m ? m[1].toLowerCase() : ''
    } catch {
        const base = path.basename(s.split('?')[0] || '')
        const m = /\.([a-z0-9]+)$/i.exec(base)
        return m ? m[1].toLowerCase() : ''
    }
}

function localBytes(url) {
    const s = String(url || '').trim()
    if (!s || /^https?:\/\//i.test(s)) return null
    let p = s
    if (/^file:\/\//i.test(s)) {
        try {
            p = decodeURIComponent(s.replace(/^file:\/\//i, ''))
        } catch {
            p = s.replace(/^file:\/\//i, '')
        }
    }
    try {
        const abs = path.resolve(p)
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return fs.statSync(abs).size
    } catch {
        /* ignore */
    }
    return null
}

function checkUrl(label, url, allowed, maxBytes, errors, warnings) {
    const s = String(url || '').trim()
    if (!s) return
    if (!/^https?:\/\//i.test(s) && localBytes(s) == null) {
        warnings.push(`${label} 不是公网 https，请先 upload.mjs 上传：${s}`)
    }
    const ext = extOf(s)
    if (ext && !allowed.has(ext)) {
        errors.push(`${label} 格式 .${ext} 不支持，允许：${[...allowed].join('、')}`)
    }
    if (!ext && /^https?:\/\//i.test(s)) {
        warnings.push(`${label} URL 看不出扩展名，请确认符合媒体要求（见 references/media-requirements.md）`)
    }
    const bytes = localBytes(s)
    if (bytes != null && maxBytes != null && bytes > maxBytes) {
        errors.push(
            `${label} 文件约 ${(bytes / 1024 / 1024).toFixed(1)}MB，超过上限 ${(maxBytes / 1024 / 1024).toFixed(0)}MB`
        )
    }
}

/**
 * @param {string} apiType realman_broadcast | broadcast_mixcut | news_mixcut
 * @param {object} body
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateSmartClipMedia(apiType, body = {}) {
    const errors = []
    const warnings = []
    const type = String(apiType || '')

    if (type === 'realman_broadcast') {
        checkUrl('videoUrl', body.videoUrl || body.video_url, VIDEO_EXT, LIMITS.videoUrlBytes, errors, warnings)
        if (!(body.videoUrl || body.video_url)) {
            errors.push('真人口播/视频包装需要 videoUrl（mp4/mov，<5 分钟，<500MB，片中需可转写人声）')
        } else {
            warnings.push(
                '请确认 videoUrl：H.264/HEVC、10–60fps（推荐 25）、单边<2000px、时长<5 分钟，且含可转写人声'
            )
        }
    }

    if (type === 'broadcast_mixcut' || type === 'news_mixcut') {
        const audio = body.audioUrl || body.audio_url
        if (type === 'broadcast_mixcut' && !audio && !body.content) {
            warnings.push('口播混剪建议提供 audioUrl 或 content 文案')
        }
        if (audio) {
            checkUrl('audioUrl', audio, AUDIO_EXT, LIMITS.audioBytes, errors, warnings)
            warnings.push('请确认 audioUrl 时长 ≤5 分钟')
        }
    }

    for (const key of ['imageUrl', 'resultImageUrl', 'image_url', 'result_image_url']) {
        if (body[key]) {
            checkUrl(key, body[key], COVER_EXT, LIMITS.coverBytes, errors, warnings)
        }
    }

    const materials = Array.isArray(body.materials) ? body.materials : []
    let estimatedSeconds = 0
    let materialIndex = 0
    for (const item of materials) {
        if (!item || typeof item !== 'object') continue
        if (String(item.type || '') === 'structure') continue
        materialIndex += 1
        const label = `materials[${materialIndex}]`
        const fileUrl = item.fileUrl || item.file_url || item.url || ''
        const t = String(item.type || '').toLowerCase()
        if (t === 'image' || IMAGE_EXT.has(extOf(fileUrl))) {
            checkUrl(label, fileUrl, IMAGE_EXT, null, errors, warnings)
            estimatedSeconds += LIMITS.imageSeconds
        } else if (t === 'video' || VIDEO_EXT.has(extOf(fileUrl))) {
            checkUrl(label, fileUrl, VIDEO_EXT, LIMITS.materialVideoBytes, errors, warnings)
            const dur = Number(item.duration || item.seconds || 0)
            if (dur > 0) {
                if (dur > LIMITS.materialVideoSeconds) {
                    errors.push(`${label} 视频时长 ${dur}s，单个不能超过 ${LIMITS.materialVideoSeconds}s`)
                }
                estimatedSeconds += dur
            } else {
                warnings.push(`${label} 未标注时长：单个视频须 ≤60s，且全部素材合计 ≤5 分钟`)
                estimatedSeconds += LIMITS.materialVideoSeconds
            }
        } else if (t === 'audio' || AUDIO_EXT.has(extOf(fileUrl))) {
            checkUrl(label, fileUrl, AUDIO_EXT, LIMITS.audioBytes, errors, warnings)
        } else if (fileUrl) {
            warnings.push(`${label} 类型不明，请标 type=image|video 并符合 media-requirements.md`)
        }
    }

    if (materials.length && estimatedSeconds > LIMITS.totalMaterialSeconds) {
        errors.push(
            `素材合计时长估算约 ${estimatedSeconds}s，超过上限 ${LIMITS.totalMaterialSeconds}s（图按 2s/张）`
        )
    }

    if (
        (type === 'broadcast_mixcut' || type === 'news_mixcut') &&
        materials.filter((m) => m && m.type !== 'structure').length === 0
    ) {
        errors.push('混剪至少需要 1 个画面素材（图片或视频）')
    }

    return { ok: errors.length === 0, errors, warnings, limits: LIMITS }
}

export { LIMITS, VIDEO_EXT, IMAGE_EXT, COVER_EXT, AUDIO_EXT, extOf }
