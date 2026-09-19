/** 统一输出结构：缺失字段一律 null */

export function emptyVideoInsight() {
    return {
        video_url: null,
        cover_url: null,
        title: null,
        description: null,
        copy: null,
        subtitle: null,
        duration: null,
        width: null,
        height: null,
        materials: null
    }
}

export function nullIfEmpty(v) {
    if (v === undefined || v === null) return null
    if (typeof v === 'string') {
        const t = v.trim()
        return t === '' ? null : t
    }
    if (Array.isArray(v)) return v.length ? v : null
    return v
}

/** 从 videoparse data 映射 */
export function fromParseData(data = {}) {
    const out = emptyVideoInsight()
    out.video_url = nullIfEmpty(data.video_url || data.videoUrl)
    out.cover_url = nullIfEmpty(data.cover_url || data.coverUrl)
    out.title = nullIfEmpty(data.title)
    out.description = nullIfEmpty(data.desc || data.description || data.video_desc)
    const title = out.title || ''
    const desc = out.description || ''
    if (title || desc) {
        out.copy = nullIfEmpty(
            !title ? desc : !desc || title === desc ? title : desc.startsWith(title) ? desc : `${title}\n\n${desc}`
        )
    }

    const res = String(data.video_list?.[0]?.resolution || data.resolution || '').trim()
    const m = res.match(/(\d+)\s*[x×]\s*(\d+)/i)
    if (m) {
        out.width = Number(m[1]) || null
        out.height = Number(m[2]) || null
    }
    out.duration = nullIfEmpty(data.duration ?? data.stats?.duration ?? null)
    if (typeof out.duration === 'string' && out.duration !== '') {
        const n = Number(out.duration)
        out.duration = Number.isFinite(n) ? n : out.duration
    }

    const materials = []
    if (out.video_url) {
        materials.push({ type: 'video', fileUrl: out.video_url })
    }
    if (out.cover_url) {
        materials.push({ type: 'image', fileUrl: out.cover_url, role: 'cover' })
    }
    const images = data.imagelist || data.images || []
    if (Array.isArray(images)) {
        for (const img of images) {
            const u = typeof img === 'string' ? img : img?.url || img?.fileUrl
            if (u && /^https?:\/\//i.test(u)) {
                materials.push({ type: 'image', fileUrl: u })
            }
        }
    }
    const audio = nullIfEmpty(data.audio_url || data.audioUrl)
    if (audio) materials.push({ type: 'audio', fileUrl: audio })
    out.materials = materials.length ? materials : null

    return out
}

export function mergeInsight(base, patch) {
    const out = { ...emptyVideoInsight(), ...(base || {}) }
    for (const [k, v] of Object.entries(patch || {})) {
        if (v === undefined) continue
        if (v === null && out[k] != null) continue
        out[k] = v
    }
    return out
}

/** 根据文案/字幕粗分内容结构，写入 materials 中的 structure 项 */
export function inferStructure({ title, copy, subtitle }) {
    const text =
        (Array.isArray(subtitle)
            ? subtitle.map((s) => (typeof s === 'string' ? s : s?.text || '')).join('\n')
            : '') ||
        copy ||
        title ||
        ''
    if (!String(text).trim()) return null

    const lines = String(text)
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    const parts = []
    if (lines.length >= 1) parts.push({ role: 'hook', text: lines[0] })
    if (lines.length >= 3) {
        const mid = lines.slice(1, -1)
        parts.push({ role: 'body', text: mid.join('\n') })
        parts.push({ role: 'ending', text: lines[lines.length - 1] })
    } else if (lines.length === 2) {
        parts.push({ role: 'body', text: lines[1] })
    }

    return {
        type: 'structure',
        summary: parts.map((p) => p.role).join(' → ') || 'single',
        segments: parts
    }
}

export function normalizeSubtitle(raw) {
    let segments = []
    if (Array.isArray(raw)) segments = raw
    else if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw)
            segments = Array.isArray(parsed) ? parsed : []
        } catch {
            segments = raw
                .split(/\n+/)
                .map((t) => t.trim())
                .filter(Boolean)
                .map((text) => ({ text }))
        }
    } else if (Array.isArray(raw?.list)) segments = raw.list

    const subtitle = segments
        .map((s) => {
            if (typeof s === 'string') return s.trim() ? { text: s.trim() } : null
            const text = String(s?.text || s?.content || s?.word || '').trim()
            if (!text) return null
            const item = { text }
            if (s?.start != null) item.start = s.start
            if (s?.end != null) item.end = s.end
            return item
        })
        .filter(Boolean)

    return subtitle.length ? subtitle : null
}
