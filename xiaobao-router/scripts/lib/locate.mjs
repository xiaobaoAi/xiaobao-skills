import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** 定位已安装或仓库内的 Skill 根目录 */
export function locateSkill(name) {
    const candidates = []
    if (process.env.XIAOBAO_SKILLS_DIR) {
        candidates.push(path.join(process.env.XIAOBAO_SKILLS_DIR, name))
    }
    candidates.push(path.join(os.homedir(), '.agents', 'skills', name))
    candidates.push(path.join(os.homedir(), '.codex', 'skills', name))
    // 仓库内并列目录：xiaobao-router/scripts/lib → ../../name
    candidates.push(path.resolve(here, '..', '..', '..', name))

    for (const dir of candidates) {
        if (fs.existsSync(path.join(dir, 'SKILL.md'))) return dir
    }
    return null
}

export function skillScript(name, file) {
    const root = locateSkill(name)
    if (!root) return null
    const p = path.join(root, 'scripts', file)
    return fs.existsSync(p) ? p : null
}
