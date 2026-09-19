/**
 * 本地验收：不调用开放平台。
 * 用法: node --test scripts/check.mjs
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { plan } from '../xiaobao-router/scripts/route.mjs'
import { adapt, runNode } from '../xiaobao-router/scripts/lib/invoke.mjs'
import { locateSkill, skillScript } from '../xiaobao-router/scripts/lib/locate.mjs'
import { fail, isEnvelope, ok } from '../xiaobao-router/scripts/lib/protocol.mjs'
import { pickTemplate } from '../xiaobao-router/scripts/lib/templates.mjs'
import { digitalScript } from '../xiaobao-viral-agent/scripts/lib/delegate-digital.mjs'
import { apiTypeToPath, modeToApiType } from '../xiaobao-viral-agent/scripts/lib/api.mjs'
import { fromParseData, normalizeSubtitle } from '../xiaobao-video-agent/scripts/lib/schema.mjs'
import { assertBizOk, extractTaskId, isDirectMediaUrl } from '../shared/xiaobao-api/client.mjs'
import {
    findPublicVoice,
    resolveAvatarUrl
} from '../xiaobao-digital-human/scripts/lib/public-catalog.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const routes = [
    ['提取这个视频的文案', 'extract_copy'],
    ['把这个视频的文案拿出来', 'extract_copy'],
    ['分析这个视频的文案', 'extract_copy'],
    ['提取字幕', 'extract_subtitle'],
    ['把封面拿出来', 'extract_cover'],
    ['分析这个视频', 'analyze_video'],
    ['帮我分析下这条视频', 'analyze_video'],
    ['用我的数字人说这段话', 'digital_speak'],
    ['把这个数字人视频做成爆款视频', 'viral_only'],
    ['把这个视频改成我的数字人口播版本', 'w1_video_digital_clip'],
    ['把抖音这条换成我出镜讲', 'w1_video_digital_clip'],
    ['把这段文案用数字人做成短视频', 'w2_copy_tts_digital_clip'],
    ['把口播文案配音后用数字人剪成片', 'w2_copy_tts_digital_clip'],
    ['把这条文案用数字人做成短视频', 'w2_copy_tts_digital_clip'],
    ['把这段文案改写后用数字人做成短视频', 'w2_copy_tts_digital_clip', true],
    ['把这个视频文案改写后用数字人做成片', 'w3_video_rewrite_digital_clip', true],
    ['给这个视频加字幕和包装', 'w4_video_subtitle_pack'],
    ['给这个视频加字幕', 'w4_video_subtitle_pack']
]

test('路由：验收句和常见改写', () => {
    for (const [text, expect, rewrite] of routes) {
        const result = plan(text)
        assert.equal(result.success, true, text)
        assert.equal(result.data.route, expect, text)
        assert.equal(result.data.user_picks_skill, false)
        if (rewrite) assert.equal(result.data.needs_agent_rewrite, true, text)
    }
})

test('路由：说不清时不要猜', () => {
    assert.equal(plan('').error.code, 'EMPTY')
    assert.equal(plan('帮我做个视频').error.code, 'AMBIGUOUS')
    assert.equal(plan('你好').error.code, 'AMBIGUOUS')
})

test('模版：按风格匹配，对不上不拿第一条', () => {
    const sample = {
        code: 200,
        data: {
            list: [
                { styleId: 'a', name: '政务稳重竖屏' },
                { styleId: 'b', name: '科技感口播' },
                { styleId: 'c', name: '种草活泼' }
            ]
        }
    }
    assert.equal(pickTemplate(sample, '要科技感一点').styleId, 'b')
    const miss = pickTemplate(sample, '赛博朋克')
    assert.equal(miss.styleId, '')
    assert.deepEqual(miss.options, ['政务稳重竖屏', '科技感口播', '种草活泼'])
    assert.equal(pickTemplate(sample, '').styleId, 'a')
    assert.equal(pickTemplate({ video_url: null, task_id: null, status: 'unknown' }, '科技').styleId, '')
})

test('适配：列模版保持原样，成片结果只留链接', () => {
    const listed = ok({ code: 200, data: { list: [{ styleId: 's1', name: '科技' }] } })
    const raw = adapt('xiaobao-viral-agent', listed, 'raw')
    assert.equal(raw.data.data.list[0].styleId, 's1')
    const polled = adapt('xiaobao-viral-agent', ok({ done: true, task_id: 't1', result_url: 'https://a.mp4' }))
    assert.equal(polled.data.video_url, 'https://a.mp4')
    assert.equal(polled.data.task_id, 't1')
    assert.equal(polled.data.status, 'completed')
})

test('适配：理解结果和数字人结果', () => {
    const video = adapt(
        'xiaobao-video-agent',
        ok({ insight: { copy: '文案', subtitle: [{ text: 'a' }], cover_url: null, video_url: 'https://v.mp4' } })
    )
    assert.equal(video.data.copy, '文案')
    assert.equal(video.data.video_url, 'https://v.mp4')
    const human = adapt('xiaobao-digital-human', ok({ audio_url: 'https://a.mp3', video_url: 'https://v.mp4', voice_name: '老板' }))
    assert.equal(human.data.voice_name, '老板')
    assert.equal(adapt('xiaobao-video-agent', fail('失败', 'X')).success, false)
})

test('失败 JSON 的 error 字符串要能读出来', async () => {
    const file = path.join(os.tmpdir(), `xb-fail-${Date.now()}.mjs`)
    fs.writeFileSync(file, `console.log(JSON.stringify({ ok: false, error: '任务失败' })); process.exit(1)\n`)
    const result = await runNode(file, [])
    fs.rmSync(file, { force: true })
    assert.equal(result.success, false)
    assert.match(result.error.message, /任务失败/)
})

test('四个 Skill 在仓库里都能定位到', () => {
    for (const name of ['xiaobao-video-agent', 'xiaobao-digital-human', 'xiaobao-viral-agent', 'xiaobao-router']) {
        assert.ok(locateSkill(name), name)
    }
    assert.ok(skillScript('xiaobao-viral-agent', 'list-templates.mjs'))
    assert.ok(skillScript('xiaobao-digital-human', 'speak.mjs'))
    assert.match(digitalScript('tts.mjs'), /xiaobao-digital-human\/scripts\/tts\.mjs$/)
})

test('剪辑 mode 映射', () => {
    assert.equal(modeToApiType('realMan'), 'realman_broadcast')
    assert.equal(modeToApiType('videoPackaging'), 'realman_broadcast')
    assert.equal(modeToApiType('oralMixCutting'), 'broadcast_mixcut')
    assert.equal(apiTypeToPath('news_mixcut'), '/api/smartclip/news_mixcut')
    assert.throws(() => modeToApiType('nope'))
})

test('视频理解字段缺失为 null', () => {
    const insight = fromParseData({ title: '标题', video_url: 'https://a.mp4', cover_url: '' })
    assert.equal(insight.copy, '标题')
    assert.equal(insight.cover_url, null)
    assert.equal(insight.video_url, 'https://a.mp4')
    assert.deepEqual(normalizeSubtitle('第一句\n第二句'), [{ text: '第一句' }, { text: '第二句' }])
    assert.equal(isDirectMediaUrl('https://a.com/v.mp4?x=1'), true)
    assert.equal(isDirectMediaUrl('https://v.douyin.com/abc'), false)
})

test('公共音色和形象按称呼解析，不必克隆', () => {
    assert.equal(findPublicVoice('热情娜娜').voice_type, 'public')
    assert.equal(findPublicVoice('男声').name, '阳光男生')
    assert.equal(findPublicVoice('悠悠').gender, 'female')
    assert.match(findPublicVoice('磁性男士').voice_id, /^c5469fea/)
    assert.match(resolveAvatarUrl('年轻女性商务'), /^https:\/\//)
    assert.match(resolveAvatarUrl('', '故事解读'), /202609100859527333c4612/)
    assert.match(resolveAvatarUrl('', '热情娜娜'), /20260910085951e1d8c1631/)
    assert.equal(resolveAvatarUrl('https://example.com/a.mp4', '女声'), 'https://example.com/a.mp4')
})

test('业务成功码含 0 和 status 0', () => {
    assert.equal(assertBizOk({ code: 0, data: { task_id: 't' } }).code, 0)
    assert.equal(assertBizOk({ status: 0, msg: 'ok' }).status, 0)
    assert.equal(extractTaskId({ data: { taskId: 'abc' } }), 'abc')
    assert.throws(() => assertBizOk({ code: 500, msg: '余额不足' }))
    assert.equal(isEnvelope(ok({ a: 1 })), true)
    assert.equal(isEnvelope({ ok: true }), false)
})

test('vendor 与 shared 客户端一致', () => {
    for (const skill of ['xiaobao-viral-agent', 'xiaobao-video-agent', 'xiaobao-digital-human']) {
        for (const file of ['client.mjs', 'credentials.mjs']) {
            const a = fs.readFileSync(path.join(root, 'shared/xiaobao-api', file), 'utf8')
            const b = fs.readFileSync(path.join(root, skill, 'scripts/vendor/xiaobao-api', file), 'utf8')
            assert.equal(a, b, `${skill}/${file}`)
        }
    }
})

test('全部脚本能通过语法检查', () => {
    const files = []
    function walk(dir) {
        for (const name of fs.readdirSync(dir)) {
            if (name === 'node_modules') continue
            const p = path.join(dir, name)
            if (fs.statSync(p).isDirectory()) walk(p)
            else if (name.endsWith('.mjs')) files.push(p)
        }
    }
    walk(root)
    const failed = []
    for (const file of files) {
        const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
        if (r.status !== 0) failed.push(`${path.relative(root, file)}\n${r.stderr}`)
    }
    assert.deepEqual(failed, [])
})

test('工作流缺参时返回明确错误，不发请求', () => {
    const script = path.join(root, 'xiaobao-router/scripts/run-workflow.mjs')
    const cases = [
        [[], 'BAD_WORKFLOW'],
        [['--id', 'w1_video_digital_clip'], 'NEED_INPUT'],
        [['--id', 'w2_copy_tts_digital_clip'], 'NEED_INPUT'],
        [['--id', 'w4_video_subtitle_pack'], 'NEED_INPUT']
    ]
    for (const [args, code] of cases) {
        const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
        assert.equal(r.status, 1, args.join(' '))
        const body = JSON.parse(r.stdout)
        assert.equal(body.error.code, code, r.stdout)
    }
})
