/**
 * 数字人能力只保留一份实现：xiaobao-digital-human。
 * 本目录同名脚本把参数原样转过去，避免两套音色记录分叉。
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export function digitalScript(file) {
    const candidates = [
        path.resolve(here, '../../../xiaobao-digital-human/scripts', file),
        path.join(os.homedir(), '.agents/skills/xiaobao-digital-human/scripts', file),
        path.join(os.homedir(), '.codex/skills/xiaobao-digital-human/scripts', file)
    ]
    return candidates.find((p) => fs.existsSync(p)) || ''
}

export function delegateDigital(file) {
    const target = digitalScript(file)
    if (!target) {
        process.stderr.write(
            `未找到 xiaobao-digital-human/${file}。请安装数字人 Skill，不要在剪辑 Skill 里另写一套。\n`
        )
        process.exit(1)
    }
    const child = spawn(process.execPath, [target, ...process.argv.slice(2)], { stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code ?? 1))
}
