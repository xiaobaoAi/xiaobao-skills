import { loadCredentials } from './credentials.mjs'

export function parseArgs(argv = process.argv.slice(2)) {
    const out = { _: [] }
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a.startsWith('--')) {
            const key = a.slice(2)
            const next = argv[i + 1]
            if (!next || next.startsWith('--')) out[key] = true
            else {
                out[key] = next
                i++
            }
        } else out._.push(a)
    }
    return out
}

export function printJson(obj) {
    process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`)
}

export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
}

export function isDirectMediaUrl(url) {
    return /\.(mp4|mov|m4v|webm|mkv|mp3|m4a|wav)(\?|#|$)/i.test(String(url || ''))
}

export function formatApiError(resp, fallback = '请求失败') {
    if (!resp || typeof resp !== 'object') return fallback
    const parts = [
        resp.msg,
        resp.message,
        resp?.data?.fail_reason,
        resp?.data?.failReason,
        resp?.data?.message,
        resp?.data?.msg,
        resp?.data?.error
    ]
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean)
    const uniq = [...new Set(parts)]
    if (uniq.length) return uniq.join(' · ')
    if (resp.code !== undefined && resp.code !== 200 && resp.code !== 0 && resp.code !== '200') {
        return `${fallback}（code=${resp.code}）`
    }
    return fallback
}

export function assertBizOk(resp, action = '请求') {
    if (!resp || typeof resp !== 'object') return resp
    const st = resp.status
    if (st === 0 || st === '0') return resp
    const code = resp.code
    const ok =
        code === undefined ||
        code === null ||
        code === 200 ||
        code === '200' ||
        code === 0 ||
        code === '0' ||
        code === 1 ||
        code === '1' ||
        code === true
    if (!ok) {
        const msg = String(resp.msg || resp.message || '')
        if (msg && msg.includes('任务创建成功')) return resp
        throw new Error(formatApiError(resp, `${action}失败`))
    }
    return resp
}

export function friendlyError(err) {
    const msg = String(err?.message || err || '')
    const lower = msg.toLowerCase()
    if (/api key|未配置|credentials|401|unauthorized/i.test(msg)) {
        return '开放平台密钥无效或未配置，请检查本机凭据后重试。'
    }
    if (/403|权限|未开通/.test(msg)) {
        return '当前账号没有该能力权限，请到开放平台开通。'
    }
    if (/余额|点数|quota|不足|存储|容量/.test(msg)) {
        return '余额、点数或存储配额不足，请充值或清理空间后再试。'
    }
    if (/格式|format|codec|unsupported/i.test(lower)) {
        return '声音或视频格式可能不受支持，请换 mp3/wav 音频或 mp4 视频后重试。'
    }
    if (/超时|timeout/i.test(lower)) {
        return '任务等待超时，请稍后重试或缩短文案。'
    }
    if (/失败|fail|error/i.test(lower)) {
        return msg.length > 180 ? `${msg.slice(0, 180)}…` : msg
    }
    return msg || '请求失败，请稍后重试。'
}

/**
 * @param {string} pathname
 * @param {object} body
 * @param {object} [opts] { query, queryKey }；兼容旧写法 { action: 'create' } 作为 query
 */
export async function postJson(pathname, body = {}, opts = {}) {
    const { base_url, api_key } = loadCredentials()
    let url = `${base_url}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
    let query = opts.query
    let queryKey = opts.queryKey
    if (!query && opts && typeof opts === 'object') {
        const rest = { ...opts }
        delete rest.query
        delete rest.queryKey
        if (Object.keys(rest).length) query = rest
    }
    const q = { ...(query || {}) }
    if (queryKey) q.key = api_key
    const qs = new URLSearchParams(
        Object.entries(q).map(([k, v]) => [k, String(v)])
    ).toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
    const payload = { key: api_key, ...body }
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
    })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return assertBizOk(data, pathname)
}

export async function postForm(pathname, fields = {}) {
    const { base_url, api_key } = loadCredentials()
    let url = `${base_url}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
    url += (url.includes('?') ? '&' : '?') + `key=${encodeURIComponent(api_key)}`
    const body = new URLSearchParams()
    body.set('key', api_key)
    for (const [k, v] of Object.entries(fields)) {
        if (v === undefined || v === null) continue
        body.set(k, String(v))
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body
    })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return data
}

function guessMime(filename) {
    const ext = String(filename || '')
        .split('.')
        .pop()
        ?.toLowerCase()
    const map = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        flac: 'audio/flac',
        ogg: 'audio/ogg',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        webm: 'video/webm',
        mkv: 'video/x-matroska',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif'
    }
    return map[ext] || 'application/octet-stream'
}

/**
 * 本地文件 → 公网 URL。
 * 文档：https://apis.xiaobao.ink/doc/49  POST /api/file/upload
 */
export async function uploadLocalFile(filePath, { folder, name } = {}) {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const { File } = await import('node:buffer')
    const abs = path.resolve(String(filePath || '').trim())
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        throw new Error(`文件不存在: ${abs || filePath}`)
    }
    const { base_url, api_key } = loadCredentials()
    const basename = path.basename(abs)
    const buf = fs.readFileSync(abs)
    const file = new File([buf], basename, { type: guessMime(basename) })
    const form = new FormData()
    form.append('file', file)
    if (folder) form.append('folder', String(folder))
    if (name) form.append('name', String(name))

    const url = new URL('/api/file/upload', base_url)
    url.searchParams.set('key', api_key)
    const res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form
    })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    const resp = assertBizOk(data, '文件上传')
    const out = resp?.data && typeof resp.data === 'object' ? resp.data : {}
    const publicUrl = String(out.url || '').trim()
    if (!publicUrl) throw new Error('上传成功但未返回公网地址')
    return {
        url: publicUrl,
        file_id: out.file_id ?? null,
        path: out.path || null,
        size: Number(out.size) || buf.length,
        storage_quota: Number(out.storage_quota) || 0,
        storage_used: Number(out.storage_used) || 0,
        storage_remain: Number(out.storage_remain) || 0,
        local_path: abs,
        response: resp
    }
}

/** http(s) 原样返回；本地路径 / file:// 先上传再返回公网 URL */
export async function ensurePublicUrl(input, opts = {}) {
    const raw = String(input || '').trim()
    if (!raw) return ''
    if (/^https?:\/\//i.test(raw)) return raw
    let local = raw
    if (/^file:\/\//i.test(raw)) {
        try {
            local = decodeURIComponent(raw.replace(/^file:\/\//i, ''))
        } catch {
            local = raw.replace(/^file:\/\//i, '')
        }
    }
    const uploaded = await uploadLocalFile(local, opts)
    return uploaded.url
}

export function extractTaskId(resp) {
    const d = resp?.data
    if (typeof d === 'string' && d.trim()) return d.trim()
    if (d && typeof d === 'object') {
        return String(d.task_id || d.taskId || d.taskid || d.id || '').trim()
    }
    return String(resp?.task_id || resp?.taskId || resp?.taskid || '').trim()
}

export function extractResultUrl(resp) {
    const d = resp?.data
    if (!d || typeof d !== 'object') {
        if (typeof resp?.url === 'string') return resp.url
        return ''
    }
    const candidates = [
        d.video_url,
        d.videoUrl,
        d.audio_url,
        d.audioUrl,
        d.result_url,
        d.resultUrl,
        d.url,
        d.file_url,
        d.fileUrl,
        d.output_url,
        d.outputUrl,
        d.voice_url,
        d.demo_url
    ]
    for (const c of candidates) {
        if (typeof c === 'string' && /^https?:\/\//i.test(c.trim())) return c.trim()
    }
    return ''
}

export function extractVoiceId(resp) {
    const d = resp?.data
    if (d && typeof d === 'object') {
        const id = d.voice_id || d.voiceId || d.id
        if (id != null && String(id).trim()) return String(id).trim()
    }
    return ''
}

export function extractStatus(resp) {
    const d = resp?.data
    if (d && typeof d === 'object') {
        return d.status ?? d.state ?? d.task_status ?? resp?.status
    }
    return resp?.status
}

/** GET /api/v1/task/query — Authorization: api_key */
export async function queryAihumanTask(taskId, type = 'video') {
    const { base_url, api_key } = loadCredentials()
    const url = new URL('/api/v1/task/query', base_url)
    url.searchParams.set('task_id', taskId)
    url.searchParams.set('type', type)
    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: api_key }
    })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return data
}

export function isTerminalSuccess(status, url) {
    if (url) return true
    const s = String(status ?? '').toLowerCase()
    return ['2', 'success', 'succeed', 'done', 'completed', 'finish', 'finished'].includes(s)
}

export function isTerminalFail(status, resp) {
    const s = String(status ?? '').toLowerCase()
    if (['3', 'fail', 'failed', 'error'].includes(s)) return true
    const msg = String(resp?.msg || resp?.data?.fail_reason || '')
    if (/失败|错误/.test(msg) && !extractResultUrl(resp)) return true
    return false
}

export async function pollAihumanTask(taskId, type, opts = {}) {
    const t = String(type || 'video').toLowerCase()
    if (t === 'voice' || t === 'clone' || t === 'clonevoice') {
        throw new Error('声音克隆请用 pollCloneVoiceTask（doc/47），不要用 /api/v1/task/query')
    }
    if (t === 'tts') {
        throw new Error('语音合成请用 pollTtsTask（doc/45），不要用 /api/v1/task/query')
    }
    if (t === 'video' || t === 'avatar' || t === 'create') {
        const done = await pollCreateTask(taskId, opts)
        return {
            ok: true,
            task_id: taskId,
            type: t,
            status: 1,
            result_url: done.video_url,
            voice_id: null,
            response: done.response,
            attempts: done.attempts
        }
    }
    throw new Error(`未知数字人任务类型: ${type}`)
}

/**
 * 语音合成查询。status：0 处理中，1 成功，2 失败。
 * 文档：https://apis.xiaobao.ink/doc/45
 */
export function interpretTtsQuery(resp) {
    const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
    const status = Number(data.status)
    if (status === 1) {
        const audioUrl = String(data.audio_url || '').trim()
        if (!audioUrl) {
            return { state: 'fail', message: '合成成功但未返回音频地址' }
        }
        return {
            state: 'done',
            task_id: String(data.task_id || '').trim(),
            audio_url: audioUrl,
            srt_url: String(data.srt_url || '').trim() || null,
            audio_duration: Number(data.audio_duration) || 0
        }
    }
    if (status === 2) {
        return { state: 'fail', message: String(data.fail_reason || resp?.msg || '语音合成失败') }
    }
    return { state: 'pending' }
}

/** GET /api/aihuman/tts_query?task_id&key */
export async function queryTtsTask(taskId) {
    const { base_url, api_key } = loadCredentials()
    const url = new URL('/api/aihuman/tts_query', base_url)
    url.searchParams.set('task_id', String(taskId))
    url.searchParams.set('key', api_key)
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return assertBizOk(data, '语音合成查询')
}

export async function pollTtsTask(taskId, { intervalMs = 4000, attempts = 60 } = {}) {
    for (let i = 1; i <= attempts; i++) {
        const resp = await queryTtsTask(taskId)
        const viewed = interpretTtsQuery(resp)
        if (viewed.state === 'done') return { ...viewed, attempts: i, response: resp }
        if (viewed.state === 'fail') throw new Error(viewed.message)
        console.error(`[poll tts ${i}/${attempts}] status=pending…`)
        await sleep(intervalMs)
    }
    throw new Error('语音合成等待超时，请稍后用任务号再查')
}

/**
 * 声音克隆查询。status：0 处理中，1 成功，2 失败。
 * 文档：https://apis.xiaobao.ink/doc/47
 */
export function interpretCloneVoiceQuery(resp) {
    const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
    const status = Number(data.status)
    if (status === 1) {
        const voiceId = String(data.voice_id || '').trim()
        if (!voiceId) {
            return { state: 'fail', message: '克隆成功但未返回音色' }
        }
        return {
            state: 'done',
            task_id: String(data.task_id || '').trim(),
            voice_id: voiceId,
            name: String(data.name || '').trim() || null,
            lang: String(data.lang || '').trim() || null,
            demo_url: String(data.demo_url || '').trim() || null
        }
    }
    if (status === 2) {
        return { state: 'fail', message: String(data.fail_reason || resp?.msg || '声音克隆失败') }
    }
    return { state: 'pending' }
}

/** GET /api/aihuman/clonevoice_query?task_id&key */
export async function queryCloneVoiceTask(taskId) {
    const { base_url, api_key } = loadCredentials()
    const url = new URL('/api/aihuman/clonevoice_query', base_url)
    url.searchParams.set('task_id', String(taskId))
    url.searchParams.set('key', api_key)
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return assertBizOk(data, '声音克隆查询')
}

export async function pollCloneVoiceTask(taskId, { intervalMs = 4000, attempts = 60 } = {}) {
    for (let i = 1; i <= attempts; i++) {
        const resp = await queryCloneVoiceTask(taskId)
        const viewed = interpretCloneVoiceQuery(resp)
        if (viewed.state === 'done') return { ...viewed, attempts: i, response: resp }
        if (viewed.state === 'fail') throw new Error(viewed.message)
        console.error(`[poll clonevoice ${i}/${attempts}] status=pending…`)
        await sleep(intervalMs)
    }
    throw new Error('声音克隆等待超时，请稍后用任务号再查')
}

/**
 * 数字人高清合成查询。status：0 处理中，1 成功，2 失败。
 * 文档：https://apis.xiaobao.ink/doc/48
 */
export function interpretCreateQuery(resp) {
    const data = resp?.data && typeof resp.data === 'object' ? resp.data : {}
    const status = Number(data.status)
    if (status === 1) {
        const videoUrl = String(data.video_url || '').trim()
        if (!videoUrl) {
            return { state: 'fail', message: '合成成功但未返回视频地址' }
        }
        return {
            state: 'done',
            task_id: String(data.task_id || '').trim(),
            video_url: videoUrl,
            video_time: Number(data.video_time) || 0,
            video_size: Number(data.video_size) || 0
        }
    }
    if (status === 2) {
        return { state: 'fail', message: String(data.fail_reason || resp?.msg || '数字人合成失败') }
    }
    return { state: 'pending' }
}

/** GET /api/aihuman/create_query?task_id&key */
export async function queryCreateTask(taskId) {
    const { base_url, api_key } = loadCredentials()
    const url = new URL('/api/aihuman/create_query', base_url)
    url.searchParams.set('task_id', String(taskId))
    url.searchParams.set('key', api_key)
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return assertBizOk(data, '数字人合成查询')
}

export async function pollCreateTask(taskId, { intervalMs = 5000, attempts = 120 } = {}) {
    for (let i = 1; i <= attempts; i++) {
        const resp = await queryCreateTask(taskId)
        const viewed = interpretCreateQuery(resp)
        if (viewed.state === 'done') return { ...viewed, attempts: i, response: resp }
        if (viewed.state === 'fail') throw new Error(viewed.message)
        console.error(`[poll create ${i}/${attempts}] status=pending…`)
        await sleep(intervalMs)
    }
    throw new Error('数字人合成等待超时，请稍后用任务号再查')
}

/**
 * 智能剪辑任务查询。status：pending|processing|completed|failed。
 * 文档：https://apis.xiaobao.ink/doc/46
 */
export function interpretSmartClipQuery(resp) {
    const data = resp?.data && typeof resp.data === 'object' ? resp.data : resp || {}
    const status = String(data.status || '').toLowerCase()
    const local = Number(data.local_status)
    const videoUrl = String(
        data.video_url || data.result?.video_url || data.result_url || data.url || ''
    ).trim()

    if (status === 'completed' || local === 2 || videoUrl) {
        if (!videoUrl) {
            return { state: 'fail', message: '剪辑完成但未返回成片地址' }
        }
        return {
            state: 'done',
            task_id: String(data.task_id || '').trim(),
            api_type: String(data.api_type || '').trim() || null,
            status: status || 'completed',
            progress: Number(data.progress) || 100,
            video_url: videoUrl,
            cover_url: String(data.result?.cover_url || data.cover_url || '').trim() || null,
            fail_reason: null
        }
    }
    if (status === 'failed' || local === 3) {
        const message =
            String(data.fail_reason || data.error?.message || resp?.msg || '智能剪辑失败').trim() ||
            '智能剪辑失败'
        return { state: 'fail', message, status: status || 'failed' }
    }
    return {
        state: 'pending',
        status: status || 'pending',
        progress: Number(data.progress) || 0
    }
}

/** GET /api/smartclip/task_query?task_id&key */
export async function querySmartClipTask(taskId) {
    const { base_url, api_key } = loadCredentials()
    const url = new URL('/api/smartclip/task_query', base_url)
    url.searchParams.set('task_id', String(taskId))
    url.searchParams.set('key', api_key)
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    const text = await res.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { raw: text }
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${formatApiError(data, text || res.statusText)}`)
    }
    return assertBizOk(data, '智能剪辑查询')
}

export async function pollSmartClipTask(taskId, { intervalMs = 5000, attempts = 180 } = {}) {
    for (let i = 1; i <= attempts; i++) {
        const resp = await querySmartClipTask(taskId)
        const viewed = interpretSmartClipQuery(resp)
        if (viewed.state === 'done') return { ...viewed, attempts: i, response: resp }
        if (viewed.state === 'fail') throw new Error(viewed.message)
        const progress = viewed.progress != null ? ` ${viewed.progress}%` : ''
        console.error(`[poll smartclip ${i}/${attempts}] ${viewed.status || 'pending'}${progress}…`)
        await sleep(intervalMs)
    }
    throw new Error(
        `智能剪辑等待超时（约 ${Math.round((intervalMs * attempts) / 60000)} 分钟）。任务可能仍在处理，请稍后用同一任务号再查：node scripts/poll-task.mjs --task-id ${taskId}`
    )
}
