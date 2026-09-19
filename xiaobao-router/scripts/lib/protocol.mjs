/** 统一信封。Router 与下游适配都用这个形状。 */

export const MAX_WORKFLOW_DEPTH = 6

export function ok(data) {
    return { success: true, data: data ?? null, error: null }
}

export function fail(message, code = 'ERROR', extra = null) {
    return {
        success: false,
        data: extra,
        error: { message: String(message || '失败'), code }
    }
}

export function isEnvelope(x) {
    return x && typeof x === 'object' && typeof x.success === 'boolean' && 'error' in x
}
