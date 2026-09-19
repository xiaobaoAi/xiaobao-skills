#!/usr/bin/env node
/**
 * 只做路由：理解任务 → 选出 Skill / Workflow。不调用 API。
 * 用法: node route.mjs --text "提取这个视频的文案"
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTES, WORKFLOWS, SKILLS } from './lib/registry.mjs'
import { ok, fail } from './lib/protocol.mjs'

function argText(argv) {
    const i = argv.indexOf('--text')
    if (i >= 0 && argv[i + 1]) return argv[i + 1]
    return argv.filter((a) => !a.startsWith('--')).join(' ')
}

export function plan(text) {
    const t = String(text || '').replace(/\s+/g, '')
    if (!t) return fail('请描述你要做什么视频', 'EMPTY')

    const workflowOrder = [
        'w3_video_rewrite_digital_clip',
        'w1_video_digital_clip',
        'w4_video_subtitle_pack',
        'w2_copy_tts_digital_clip'
    ]
    for (const id of workflowOrder) {
        const wf = WORKFLOWS[id]
        if (wf?.test(t)) {
            return ok({
                route: id,
                title: wf.title,
                skills: wf.skills,
                needs_agent_rewrite: Boolean(wf.needsAgentRewrite) || /改写/.test(t),
                depth: wf.skills.length,
                user_picks_skill: false
            })
        }
    }
    for (const route of ROUTES) {
        if (route.test(t)) {
            return ok({
                route: route.id,
                title: SKILLS[route.skills[0]]?.description || route.id,
                skills: route.skills,
                needs_agent_rewrite: false,
                depth: 1,
                user_picks_skill: false
            })
        }
    }
    return fail('还无法判断要分析视频、做数字人，还是直接剪辑。请用一句话补充目标。', 'AMBIGUOUS')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
    const text = argText(process.argv.slice(2))
    const result = plan(text)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    process.exit(result.success ? 0 : 1)
}
