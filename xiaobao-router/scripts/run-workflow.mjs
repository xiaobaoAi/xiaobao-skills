#!/usr/bin/env node
/**
 * 按 Workflow 顺序调用底层 Skill 脚本。Router 不实现开放平台请求。
 * 用法:
 *   node run-workflow.mjs --id w1_video_digital_clip --url URL --person-video URL --voice-name 老板音
 *   node run-workflow.mjs --id w3_video_rewrite_digital_clip --url URL --rewritten-copy "改写后的文案" ...
 *   数字人完成后默认停在包装确认闸门；用户说「全自动」或 Agent 已确认后再带 --auto-pack --video-url 续跑剪辑。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { WORKFLOWS } from './lib/registry.mjs'
import { fail, ok, MAX_WORKFLOW_DEPTH } from './lib/protocol.mjs'
import { skillScript } from './lib/locate.mjs'
import { adapt, runNode } from './lib/invoke.mjs'
import { pickTemplate } from './lib/templates.mjs'

function argsOf(argv) {
    const out = {}
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith('--')) continue
        const key = argv[i].slice(2)
        const next = argv[i + 1]
        if (!next || next.startsWith('--')) out[key] = true
        else {
            out[key] = next
            i++
        }
    }
    return out
}

function spokenText(copy) {
    const text = String(copy || '').trim()
    if (text.length <= 1200) return text
    return text.slice(0, 1200)
}

function speakArgs(copy) {
    const argv = ['--text', spokenText(copy)]
    if (person) argv.push('--person-video', person)
    if (voiceName) argv.push('--voice-name', voiceName)
    return argv
}

function isTruthyFlag(v) {
    return v === true || v === 'true' || v === '1' || v === 'yes'
}

function print(envelope) {
    process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`)
    process.exit(envelope.success ? 0 : 1)
}

async function callSkill(skill, file, argv, depth, purpose = 'result') {
    if (depth > MAX_WORKFLOW_DEPTH) {
        return fail(`工作流超过最大深度 ${MAX_WORKFLOW_DEPTH}，已停止`, 'MAX_DEPTH')
    }
    if (skill === 'xiaobao-router') {
        return fail('Router 不能调用自己', 'CYCLE')
    }
    const script = skillScript(skill, file)
    if (!script) return fail(`未安装技能 ${skill}，或缺少 ${file}`, 'SKILL_MISSING')
    const raw = await runNode(script, argv)
    return adapt(skill, raw, purpose)
}

async function clip({ mode, videoUrl, title, subtitle, materials, styleHint, depth }) {
    const listed = await callSkill(
        'xiaobao-viral-agent',
        'list-templates.mjs',
        ['--scene', mode === 'videoPackaging' || mode === 'realMan' ? 'realMan' : mode],
        depth,
        'raw'
    )
    if (!listed.success) return listed
    const picked = pickTemplate(listed.data, styleHint)
    if (!picked.styleId) {
        const options = picked.options.length ? `可选：${picked.options.join('、')}` : '请换一种风格描述'
        return fail(`没有匹配到剪辑风格。${options}`, 'NO_TEMPLATE')
    }

    const payload = {
        styleId: picked.styleId,
        videoUrl,
        title: title || '口播成片',
        processRules: { watermarkShow: false }
    }
    if (Array.isArray(subtitle) && subtitle.length) payload.subtitle = subtitle
    if (Array.isArray(materials) && materials.length) payload.materials = materials

    const file = path.join(os.tmpdir(), `xb-router-${Date.now()}.json`)
    fs.writeFileSync(file, JSON.stringify(payload))
    let created
    try {
        created = await callSkill(
            'xiaobao-viral-agent',
            'create-task.mjs',
            ['--mode', mode, '--input', file],
            depth + 1,
            'raw'
        )
    } finally {
        fs.rmSync(file, { force: true })
    }
    if (!created.success) return created
    const taskId =
        created.data?.task_id ||
        created.data?.response?.data?.task_id ||
        created.data?.data?.task_id
    if (!taskId) return fail('剪辑任务已提交，但没有返回任务号', 'NO_TASK')
    const polled = await callSkill(
        'xiaobao-viral-agent',
        'poll-task.mjs',
        ['--mode', mode, '--task-id', String(taskId)],
        depth + 2
    )
    if (polled.success) polled.data.style_name = picked.styleName || null
    return polled
}

/** 数字人完成后的包装确认闸门：禁止默认闷头剪辑 */
function packConfirmGate({ workflowId, videoUrl, titleDraft, audioUrl, voiceName, person }) {
    return ok({
        status: 'await_user',
        stage: 'pack_confirm',
        agent_must_ask_user: true,
        workflow_id: workflowId,
        video_url: videoUrl,
        audio_url: audioUrl || null,
        voice_name: voiceName || null,
        person: person || null,
        title_draft: titleDraft || '',
        ask: {
            zh: [
                '数字人口播已完成。包装成片前请确认（也可直接说「全自动，你来安排」）：',
                '1. 模版：A 我来选（列几个风格） / B 系统自动选',
                '2. 补充素材：A 只要这条主视频 / B 我再传几段视频或图片',
                '3. 封面与标题：A 先给我草案再确认 / B 你全权智能安排'
            ].join('\n')
        },
        hint: '对用户展示上方三项询问；未确认前禁止 create-task。用户说全自动后，用已有 video_url 走 viral-agent realMan，或带 --auto-pack --video-url 续跑。不要重新 speak。',
        next: {
            id: workflowId,
            after_user_confirms: [
                '--id',
                workflowId,
                '--auto-pack',
                '--video-url',
                videoUrl,
                '--title',
                titleDraft || '口播成片',
                ...(styleHint ? ['--style-hint', styleHint] : [])
            ]
        }
    })
}

const args = argsOf(process.argv.slice(2))
const id = String(args.id || '')
const wf = WORKFLOWS[id]
if (!wf) {
    print(fail('未知 workflow id', 'BAD_WORKFLOW'))
}

const url = String(args.url || '')
const person = String(args['person-video'] || '')
const voiceName = String(args['voice-name'] || '')
const text = String(args.text || args['rewritten-copy'] || '')
const styleHint = String(args['style-hint'] || '')
const titleArg = String(args.title || '')
const existingVideoUrl = String(args['video-url'] || '')
const autoPack = isTruthyFlag(args['auto-pack'])

try {
    let depth = 1

    // 用户已确认包装：仅剪辑，不再 speak
    if (autoPack && existingVideoUrl && (id === 'w1_video_digital_clip' || id === 'w2_copy_tts_digital_clip' || id === 'w3_video_rewrite_digital_clip')) {
        print(
            await clip({
                mode: 'realMan',
                videoUrl: existingVideoUrl,
                title: titleArg || text.slice(0, 18) || '口播成片',
                styleHint,
                depth: 1
            })
        )
    }

    if (id === 'w1_video_digital_clip' || id === 'w3_video_rewrite_digital_clip') {
        if (!url) {
            print(fail('还需要原视频链接。形象和音色可不填，将使用公共形象与公共音色。', 'NEED_INPUT'))
        }
        const understood = await callSkill(
            'xiaobao-video-agent',
            'analyze-video.mjs',
            ['--url', url, '--intent', 'analyze'],
            depth
        )
        depth += 1
        if (!understood.success) print(understood)
        let copy = understood.data.copy || ''
        if (id === 'w3_video_rewrite_digital_clip' && !args['rewritten-copy']) {
            print(
                ok({
                    status: 'await_agent',
                    stage: 'rewrite',
                    agent_must_continue: true,
                    copy,
                    hint: '同一轮内改写下方文案，立刻用 --rewritten-copy 再跑本 workflow；不要停下来问用户，也不要把 await_agent 当成失败。',
                    next: {
                        id: 'w3_video_rewrite_digital_clip',
                        args: [
                            '--id',
                            'w3_video_rewrite_digital_clip',
                            '--url',
                            url,
                            ...(person ? ['--person-video', person] : []),
                            ...(voiceName ? ['--voice-name', voiceName] : []),
                            ...(styleHint ? ['--style-hint', styleHint] : []),
                            '--rewritten-copy',
                            '<改写后的完整口播文案>'
                        ]
                    }
                })
            )
        }
        if (args['rewritten-copy']) copy = String(args['rewritten-copy'])
        if (!copy) print(fail('没有提取到可用文案', 'NO_COPY'))

        const spoken = await callSkill(
            'xiaobao-digital-human',
            'speak.mjs',
            speakArgs(copy),
            depth
        )
        depth += 1
        if (!spoken.success) print(spoken)

        if (!autoPack) {
            print(
                packConfirmGate({
                    workflowId: id,
                    videoUrl: spoken.data.video_url,
                    audioUrl: spoken.data.audio_url,
                    voiceName: spoken.data.voice_name || voiceName,
                    person: spoken.data.person || person,
                    titleDraft: titleArg || understood.data.title || copy.slice(0, 18)
                })
            )
        }

        print(
            await clip({
                mode: 'realMan',
                videoUrl: spoken.data.video_url,
                title: titleArg || understood.data.title,
                subtitle: understood.data.subtitle,
                styleHint,
                depth
            })
        )
    }

    if (id === 'w2_copy_tts_digital_clip') {
        if (!text) {
            print(fail('还需要口播文案。形象和音色可不填，将使用公共形象与公共音色。', 'NEED_INPUT'))
        }
        const spoken = await callSkill('xiaobao-digital-human', 'speak.mjs', speakArgs(text), 1)
        if (!spoken.success) print(spoken)

        if (!autoPack) {
            print(
                packConfirmGate({
                    workflowId: id,
                    videoUrl: spoken.data.video_url,
                    audioUrl: spoken.data.audio_url,
                    voiceName: spoken.data.voice_name || voiceName,
                    person: spoken.data.person || person,
                    titleDraft: titleArg || text.slice(0, 18)
                })
            )
        }

        print(
            await clip({
                mode: 'realMan',
                videoUrl: spoken.data.video_url,
                title: titleArg || text.slice(0, 18),
                styleHint,
                depth: 3
            })
        )
    }

    if (id === 'w4_video_subtitle_pack') {
        if (!url) print(fail('还需要成片视频链接', 'NEED_INPUT'))
        const understood = await callSkill(
            'xiaobao-video-agent',
            'analyze-video.mjs',
            ['--url', url, '--intent', 'subtitle'],
            1
        )
        if (!understood.success) print(understood)
        const videoUrl = understood.data.video_url || url

        if (!autoPack) {
            print(
                packConfirmGate({
                    workflowId: id,
                    videoUrl,
                    titleDraft: titleArg || understood.data.title || ''
                })
            )
        }

        print(
            await clip({
                mode: 'videoPackaging',
                videoUrl,
                title: titleArg || understood.data.title,
                subtitle: understood.data.subtitle,
                styleHint,
                depth: 3
            })
        )
    }

    print(fail('该 workflow 没有执行分支', 'NOT_IMPLEMENTED'))
} catch (e) {
    print(fail(e.message || String(e), 'ROUTER'))
}
