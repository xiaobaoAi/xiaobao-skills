/** 内置公共音色与形象。用户用称呼即可，不必再克隆。voice_id 仅脚本内部使用。 */

export const PUBLIC_VOICES = [
    {
        name: '热情娜娜',
        gender: 'female',
        voice_id: 'c5469fea64412d85',
        voice_type: 'public',
        demo_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/f443f03396f943c6d93a767baa41e5aa_1778296406.wav'
    },
    {
        name: '悠悠',
        gender: 'female',
        voice_id: 'c5469fea1ca07847',
        voice_type: 'public',
        demo_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/2ff8775941da6a8be38a7028cf0382ce_1778295258.wav'
    },
    {
        name: '阳光男生',
        gender: 'male',
        voice_id: 'c5469fea627d2d6c',
        voice_type: 'public',
        demo_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/4db777fd7fb9bee0010cb6cf32ab769e_1778296375.wav'
    },
    {
        name: '故事解读',
        gender: 'male',
        voice_id: 'c5469fea610b1ba8',
        voice_type: 'public',
        demo_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/6b28c94190242046e31c2d43534d69e5_1778296353.wav'
    },
    {
        name: '磁性男士',
        gender: 'male',
        voice_id: 'c5469fea5f76c4bf',
        voice_type: 'public',
        demo_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/975294e26d8c2894c42f458449c9ee02_1778296333.wav'
    }
]

export const PUBLIC_AVATARS = [
    {
        name: '新闻主播',
        gender: 'female',
        style: '职业女性·专业',
        video_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/video/20260921/202609211043306cd031836.mp4'
    },
    {
        name: '日常自然',
        gender: 'female',
        style: '日常·自然',
        video_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/video/20260921/2026092110432979e0c8897.mp4'
    },
    {
        name: '男生新闻主播',
        gender: 'male',
        style: '男性·新闻主播',
        video_url:
            'https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/video/20260921/20260921105256763f36229.mp4'
    }
]

const VOICE_ALIASES = {
    女声: '热情娜娜',
    女生: '热情娜娜',
    女配: '悠悠',
    娜娜: '热情娜娜',
    男声: '阳光男生',
    男生: '阳光男生',
    阳光: '阳光男生',
    磁性: '磁性男士',
    故事: '故事解读'
}

const AVATAR_ALIASES = {
    新闻: '新闻主播',
    职业女性: '新闻主播',
    专业: '新闻主播',
    女主播: '新闻主播',
    主播: '新闻主播',
    商务: '新闻主播',
    年轻女性商务: '新闻主播',
    日常: '日常自然',
    自然: '日常自然',
    年轻女性: '日常自然',
    男生新闻主播: '男生新闻主播',
    男新闻主播: '男生新闻主播',
    男性新闻主播: '男生新闻主播',
    男主播: '男生新闻主播',
    男生: '男生新闻主播',
    男性: '男生新闻主播',
    中年稳重主播: '男生新闻主播',
    稳重: '男生新闻主播'
}

function norm(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
}

function matchItem(list, hint, aliases) {
    const n = norm(hint)
    if (!n) return null
    const exact = list.find((item) => norm(item.name) === n)
    if (exact) return exact
    const contained = list
        .filter((item) => n.includes(norm(item.name)))
        .sort((a, b) => b.name.length - a.name.length)
    if (contained[0]) return contained[0]
    const aliasName = aliases[n]
    if (aliasName) return list.find((item) => item.name === aliasName) || null
    return null
}

export function findPublicVoice(hint) {
    return matchItem(PUBLIC_VOICES, hint, VOICE_ALIASES)
}

export function findPublicAvatar(hint) {
    return matchItem(PUBLIC_AVATARS, hint, AVATAR_ALIASES)
}

export function defaultPublicVoice() {
    return PUBLIC_VOICES[0]
}

export function avatarForGender(gender) {
    if (gender === 'male') {
        return findPublicAvatar('男生新闻主播') || PUBLIC_AVATARS.find((item) => item.gender === 'male')
    }
    return findPublicAvatar('日常自然') || PUBLIC_AVATARS.find((item) => item.gender === 'female') || PUBLIC_AVATARS[0]
}

export function resolveAvatarUrl(hint, voiceHint = '') {
    const raw = String(hint || '').trim()
    if (/^https?:\/\//i.test(raw)) return raw
    // 本地路径留给 ensurePublicUrl 上传
    if (
        raw &&
        (/^file:\/\//i.test(raw) ||
            /[\\/]/.test(raw) ||
            /\.(mp4|mov|m4v|webm|mkv)$/i.test(raw))
    ) {
        return raw
    }
    const named = findPublicAvatar(raw)
    if (named) return named.video_url
    if (raw) return ''
    const voice = findPublicVoice(voiceHint) || defaultPublicVoice()
    return avatarForGender(voice.gender).video_url
}

export function publicVoiceNames() {
    return PUBLIC_VOICES.map((item) => item.name)
}

export function publicAvatarNames() {
    return PUBLIC_AVATARS.map((item) => item.name)
}
