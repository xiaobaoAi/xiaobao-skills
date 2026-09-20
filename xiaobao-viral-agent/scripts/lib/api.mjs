/** 智能剪辑专用；HTTP 客户端见 scripts/vendor/xiaobao-api */
export {
    loadCredentials,
    saveCredentials,
    resolveNotifyUrl,
    DEFAULT_NOTIFY_URL
} from '../vendor/xiaobao-api/credentials.mjs'

export {
    parseArgs,
    printJson,
    sleep,
    formatApiError,
    assertBizOk,
    postJson,
    postForm,
    extractTaskId,
    extractResultUrl,
    extractStatus,
    queryAihumanTask,
    pollAihumanTask,
    querySmartClipTask,
    pollSmartClipTask,
    interpretSmartClipQuery,
    friendlyError
} from '../vendor/xiaobao-api/client.mjs'

export function modeToApiType(mode) {
    switch (String(mode || '').trim()) {
        case 'oralMixCutting':
            return 'broadcast_mixcut'
        case 'newsMixCutting':
            return 'news_mixcut'
        case 'realMan':
        case 'videoPackaging':
            return 'realman_broadcast'
        default:
            throw new Error(
                `未知 mode: ${mode}。可选：realMan | oralMixCutting | newsMixCutting | videoPackaging`
            )
    }
}

export function apiTypeToPath(apiType) {
    const map = {
        realman_broadcast: '/api/smartclip/realman_broadcast',
        broadcast_mixcut: '/api/smartclip/broadcast_mixcut',
        news_mixcut: '/api/smartclip/news_mixcut'
    }
    const path = map[apiType]
    if (!path) throw new Error(`未知 apiType: ${apiType}`)
    return path
}

export function ensureProcessRules(body) {
    const next = { ...body }
    const rules = typeof next.processRules === 'object' && next.processRules ? { ...next.processRules } : {}
    if (!Object.prototype.hasOwnProperty.call(rules, 'watermarkShow')) {
        rules.watermarkShow = false
    }
    next.processRules = rules
    return next
}

/** 创建时补默认 notify / callback_url；结果仍靠 task_query 轮询 */
export function ensureNotify(body) {
    const next = { ...(body || {}) }
    if (next.notify || next.callback_url || next.callbackUrl) return next
    const url = resolveNotifyUrl()
    next.notify = url
    next.callback_url = url
    return next
}

export function whitelistBody(apiType, body) {
    const src = ensureNotify(ensureProcessRules(body || {}))
    if (apiType === 'broadcast_mixcut') {
        return pick(src, [
            'styleId',
            'materials',
            'audioUrl',
            'resolution',
            'content',
            'callback_url',
            'notify',
            'title',
            'language',
            'packRules',
            'structLayers',
            'processRules',
            'introduceCard'
        ])
    }
    if (apiType === 'news_mixcut') {
        return pick(src, [
            'styleId',
            'materials',
            'title',
            'callback_url',
            'notify',
            'language',
            'packRules',
            'structLayers',
            'processRules',
            'introduceCard',
            'content'
        ])
    }
    return pick(src, [
        'styleId',
        'videoUrl',
        'language',
        'title',
        'materials',
        'materialSoundSwitch',
        'packRules',
        'structLayers',
        'processRules',
        'introduceCard',
        'subtitle',
        'callback_url',
        'callbackUrl',
        'notify'
    ])
}

function pick(obj, keys) {
    const out = {}
    for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
            out[k] = obj[k]
        }
    }
    return out
}
