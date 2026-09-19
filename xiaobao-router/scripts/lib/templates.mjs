/** 从 list-templates 原始响应里选模版。匹配不上时返回候选名称，不瞎取第一条。 */

function asList(root) {
    if (!root || typeof root !== 'object') return []
    const buckets = [
        root.list,
        root.templates,
        root.records,
        root.rows,
        root.items,
        root.data?.list,
        root.data?.templates,
        root.data?.records,
        root.data?.rows,
        Array.isArray(root.data) ? root.data : null,
        Array.isArray(root) ? root : null
    ]
    return buckets.find(Array.isArray) || []
}

function labelOf(item) {
    return String(item?.name || item?.title || item?.styleName || item?.style_name || '').trim()
}

function idOf(item) {
    return String(item?.styleId || item?.style_id || item?.id || '').trim()
}

function score(item, hint) {
    const name = [labelOf(item), item?.ratio, item?.aspect, item?.remark, item?.tag]
        .filter(Boolean)
        .join(' ')
    if (!hint || !name) return 0
    let points = 0
    const words = ['科技', '政务', '种草', '活泼', '稳重', '新闻', '口播', '竖屏', '横屏', '抖音', '简洁', '商务', '封面']
    for (const word of words) {
        if (hint.includes(word) && name.includes(word)) points += 3
    }
    for (let i = 0; i < name.length - 1; i++) {
        const gram = name.slice(i, i + 2)
        if (/[\u4e00-\u9fff]{2}/.test(gram) && hint.includes(gram)) points += 2
    }
    return points
}

export function pickTemplate(raw, hint = '') {
    const list = asList(raw?.data ?? raw)
    const usable = list.filter((item) => idOf(item))
    if (!usable.length) return { styleId: '', styleName: '', options: [] }
    const hintText = String(hint || '').replace(/\s+/g, '')
    let best = null
    let bestScore = 0
    for (const item of usable) {
        const points = score(item, hintText)
        if (points > bestScore) {
            best = item
            bestScore = points
        }
    }
    if (bestScore > 0 && best) {
        return { styleId: idOf(best), styleName: labelOf(best) || '已匹配风格', options: [] }
    }
    if (!hintText) {
        const first = usable[0]
        return { styleId: idOf(first), styleName: labelOf(first) || '默认风格', options: [] }
    }
    return {
        styleId: '',
        styleName: '',
        options: usable.map(labelOf).filter(Boolean).slice(0, 4)
    }
}
