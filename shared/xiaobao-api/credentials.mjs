import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const CREDENTIALS_DIR = path.join(os.homedir(), '.xiaobao-skills')
export const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json')
export const VOICES_FILE = path.join(CREDENTIALS_DIR, 'voices.json')

export function loadCredentials() {
    const fromEnv = {
        base_url: String(process.env.XIAOBAO_BASE_URL || '').trim(),
        api_key: String(process.env.XIAOBAO_API_KEY || '').trim()
    }
    let fromFile = {}
    if (fs.existsSync(CREDENTIALS_FILE)) {
        try {
            fromFile = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8')) || {}
        } catch {
            throw new Error(`凭据文件无法解析: ${CREDENTIALS_FILE}`)
        }
    }
    const base_url = (fromEnv.base_url || fromFile.base_url || 'https://apis.xiaobao.ink').replace(
        /\/+$/,
        ''
    )
    const api_key = fromEnv.api_key || fromFile.api_key || ''
    if (!api_key) {
        throw new Error(
            `未配置 API Key。请运行 setup-credentials.mjs，或设置 XIAOBAO_API_KEY。申请：https://apis.xiaobao.ink/`
        )
    }
    return {
        base_url,
        api_key,
        default_voice_id: fromFile.default_voice_id || fromEnv.default_voice_id || '',
        default_voice_type: fromFile.default_voice_type || 'custom'
    }
}

export function saveCredentials({ base_url, api_key, default_voice_id, default_voice_type }) {
    const url = String(base_url || 'https://apis.xiaobao.ink').trim().replace(/\/+$/, '')
    const key = String(api_key || '').trim()
    if (!key) throw new Error('api_key 不能为空')
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 })
    try {
        fs.chmodSync(CREDENTIALS_DIR, 0o700)
    } catch {
        /* ignore */
    }
    let prev = {}
    if (fs.existsSync(CREDENTIALS_FILE)) {
        try {
            prev = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8')) || {}
        } catch {
            prev = {}
        }
    }
    const payload = {
        base_url: url,
        api_key: key
    }
    const dv = default_voice_id !== undefined ? default_voice_id : prev.default_voice_id
    const dt = default_voice_type !== undefined ? default_voice_type : prev.default_voice_type
    if (dv) payload.default_voice_id = dv
    if (dt) payload.default_voice_type = dt
    fs.writeFileSync(CREDENTIALS_FILE, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 })
    try {
        fs.chmodSync(CREDENTIALS_FILE, 0o600)
    } catch {
        /* ignore */
    }
    return CREDENTIALS_FILE
}

export function loadVoiceBook() {
    if (!fs.existsSync(VOICES_FILE)) return { voices: [] }
    try {
        return JSON.parse(fs.readFileSync(VOICES_FILE, 'utf8')) || { voices: [] }
    } catch {
        return { voices: [] }
    }
}

export function saveVoiceBook(book) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 })
    fs.writeFileSync(VOICES_FILE, `${JSON.stringify(book, null, 2)}\n`, { mode: 0o600 })
    return VOICES_FILE
}

/** 按显示名查找已保存音色（不对用户暴露 id 时供 Agent 内部用） */
export function findVoiceByName(name) {
    const n = String(name || '').trim().toLowerCase()
    if (!n) return null
    const book = loadVoiceBook()
    return (
        (book.voices || []).find((v) => String(v.name || '').trim().toLowerCase() === n) || null
    )
}

export function upsertVoice({ name, voice_id, voice_type = 'custom', sample_url = '' }) {
    const book = loadVoiceBook()
    const voices = Array.isArray(book.voices) ? [...book.voices] : []
    const idx = voices.findIndex((v) => v.voice_id === voice_id || v.name === name)
    const row = {
        name: name || `voice-${String(voice_id).slice(0, 8)}`,
        voice_id,
        voice_type,
        sample_url,
        updated_at: new Date().toISOString()
    }
    if (idx >= 0) voices[idx] = { ...voices[idx], ...row }
    else voices.push(row)
    saveVoiceBook({ voices })
    return row
}
