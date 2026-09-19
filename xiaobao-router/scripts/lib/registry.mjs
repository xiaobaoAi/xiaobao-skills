/**
 * Skill 协议登记。Router 只读此表，不实现业务 API。
 * 禁止把 xiaobao-router 列入任何 Skill 的 calls。
 */
export const SKILLS = {
    'xiaobao-video-agent': {
        name: 'xiaobao-video-agent',
        description: '理解已有视频：解析链接、文案、字幕、封面、素材结构。不生成成片。',
        capabilities: ['analyze', 'copy', 'subtitle', 'cover', 'parse'],
        input: {
            url: '分享链接或视频直链'
        },
        output: ['copy', 'subtitle', 'cover_url', 'video_url', 'title', 'description', 'materials']
    },
    'xiaobao-digital-human': {
        name: 'xiaobao-digital-human',
        description: '数字人生产：克隆声音、TTS、数字人视频。不负责模版剪辑。',
        capabilities: ['clone_voice', 'tts', 'create_avatar', 'speak'],
        input: {
            text: '口播文案',
            voice_name: '已保存音色名称',
            audio_sample_url: '声音样本',
            person_video: '形象视频',
            audio_url: '已有配音'
        },
        output: ['audio_url', 'video_url', 'voice_name']
    },
    'xiaobao-viral-agent': {
        name: 'xiaobao-viral-agent',
        description: '智能剪辑成片：数字人口播、素材混剪、新闻混剪、视频包装。',
        capabilities: ['realMan', 'oralMixCutting', 'newsMixCutting', 'videoPackaging'],
        input: {
            mode: '剪辑模式',
            video_url: '口播或成片地址',
            audio_url: '旁白音频',
            materials: '画面素材',
            title: '标题',
            subtitle: '字幕分段',
            style_hint: '风格描述（内部再选模版）'
        },
        output: ['video_url', 'task_id', 'status']
    }
}

function hasVideoRef(t) {
    if (/这个视频|这条视频|原视频|抖音|快手|小红书|视频号|分享链接/.test(t)) return true
    return /这条(?!文案|口播|话)/.test(t)
}

function wantsAvatar(t) {
    return /数字人|我出镜|换成我|改成我|我来讲|我的口播/.test(t)
}

/** 单技能直达（depth=1）。工作流优先于本表。 */
export const ROUTES = [
    {
        id: 'extract_copy',
        skills: ['xiaobao-video-agent'],
        test: (t) =>
            /提取.*(文案|口播)|文案提取|文案拿出来|拿.*文案|看.*(文案|口播稿)|分析.*(文案|口播)/.test(t) &&
            !/改写|数字人|爆款|包装|做成/.test(t)
    },
    {
        id: 'extract_subtitle',
        skills: ['xiaobao-video-agent'],
        test: (t) => /提取字幕|字幕提取|把字幕拿出来/.test(t) && !/包装|数字人|做成/.test(t)
    },
    {
        id: 'extract_cover',
        skills: ['xiaobao-video-agent'],
        test: (t) => /提取封面|封面拿出来|封面抠出来/.test(t) && !/包装|数字人/.test(t)
    },
    {
        id: 'analyze_video',
        skills: ['xiaobao-video-agent'],
        test: (t) => {
            if (/改|换|数字人|生成|包装|提取|文案|字幕|爆款|剪辑|做成/.test(t)) return false
            return /分析|看看|讲了什么|讲什么/.test(t) && /视频|这条/.test(t)
        }
    },
    {
        id: 'digital_speak',
        skills: ['xiaobao-digital-human'],
        test: (t) =>
            /用(我的)?数字人说|数字人说这段|生成语音|克隆(我的)?声音|用我的声音读|配音成音频/.test(t) &&
            !/爆款|剪辑|短视频|成片|包装|改成|换成|做成/.test(t)
    },
    {
        id: 'viral_only',
        skills: ['xiaobao-viral-agent'],
        test: (t) =>
            /做成爆款|智能剪辑|视频包装|素材混剪|新闻混剪/.test(t) &&
            !/提取文案|改成我的数字人|改写|出镜/.test(t)
    }
]

export const WORKFLOWS = {
    w1_video_digital_clip: {
        id: 'w1_video_digital_clip',
        title: '视频解析 → 数字人 → 智能剪辑',
        skills: ['xiaobao-video-agent', 'xiaobao-digital-human', 'xiaobao-viral-agent'],
        test: (t) => {
            if (/改写/.test(t)) return false
            if (/说这段/.test(t) && !/改|换|重做|版本/.test(t)) return false
            const remake = /改成|换成|重做|出镜讲|口播版本|做成我的/.test(t)
            const fromVideoCopy = hasVideoRef(t) && /文案/.test(t) && wantsAvatar(t) && /做成|剪成|短视频|成片/.test(t)
            return (hasVideoRef(t) && wantsAvatar(t) && remake) || fromVideoCopy
        }
    },
    w2_copy_tts_digital_clip: {
        id: 'w2_copy_tts_digital_clip',
        title: '文案 → TTS → 数字人 → 智能剪辑',
        skills: ['xiaobao-digital-human', 'xiaobao-viral-agent'],
        test: (t) =>
            /文案|这段话|这段口播/.test(t) &&
            wantsAvatar(t) &&
            /短视频|成片|剪辑|剪成|爆款/.test(t) &&
            !hasVideoRef(t)
    },
    w3_video_rewrite_digital_clip: {
        id: 'w3_video_rewrite_digital_clip',
        title: '视频 → 文案 → 改写 → 数字人 → 智能剪辑',
        skills: ['xiaobao-video-agent', 'xiaobao-digital-human', 'xiaobao-viral-agent'],
        needsAgentRewrite: true,
        test: (t) => /改写/.test(t) && /数字人|口播/.test(t) && hasVideoRef(t)
    },
    w4_video_subtitle_pack: {
        id: 'w4_video_subtitle_pack',
        title: '视频 → 字幕 → 视频包装',
        skills: ['xiaobao-video-agent', 'xiaobao-viral-agent'],
        test: (t) => {
            if (/改写|数字人|提取/.test(t)) return false
            if (/包装/.test(t) && /字幕|这个视频|成片|这条/.test(t)) return true
            return /加字幕/.test(t) && /视频|成片|这条/.test(t)
        }
    }
}
