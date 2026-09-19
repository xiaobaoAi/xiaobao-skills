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
    if (/余额|点数|quota|不足/.test(msg)) {
        return '余额或点数不足，请充值后再试。'
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

export async function pollAihumanTask(taskId, type, { intervalMs = 4000, attempts = 60 } = {}) {
    for (let i = 1; i <= attempts; i++) {
        const resp = await queryAihumanTask(taskId, type)
        const status = extractStatus(resp)
        const url = extractResultUrl(resp)
        const voiceId = extractVoiceId(resp)

        if (type === 'voice' && voiceId) {
            return {
                ok: true,
                task_id: taskId,
                type,
                status,
                result_url: url || null,
                voice_id: voiceId,
                response: resp,
                attempts: i
            }
        }
        if (isTerminalSuccess(status, url)) {
            return {
                ok: true,
                task_id: taskId,
                type,
                status,
                result_url: url || null,
                voice_id: voiceId || null,
                response: resp,
                attempts: i
            }
        }
        if (isTerminalFail(status, resp)) {
            throw new Error(formatApiError(resp, '任务失败'))
        }
        console.error(`[poll ${type} ${i}/${attempts}] status=${status ?? 'pending'}…`)
        await sleep(intervalMs)
    }
    throw new Error('任务等待超时，请稍后重试')
}
