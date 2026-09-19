#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
WITH_CODEX=0
TARGET="all"

for a in "$@"; do
  case "$a" in
    --codex) WITH_CODEX=1 ;;
    viral|video|digital|router|all) TARGET="$a" ;;
  esac
done

# 安装前同步公共 client
if [[ -f "$ROOT/scripts/sync-shared.mjs" ]]; then
  node "$ROOT/scripts/sync-shared.mjs" || true
fi

install_one() {
  local name="$1"
  local src="$ROOT/$name"
  local dest_agents="${HOME}/.agents/skills/${name}"
  local dest_codex="${HOME}/.codex/skills/${name}"
  if [[ ! -d "$src" ]]; then
    echo "跳过（不存在）: $src"
    return
  fi
  mkdir -p "$(dirname "$dest_agents")"
  rm -rf "$dest_agents"
  cp -R "$src" "$dest_agents"
  echo "已安装: $dest_agents"
  if [[ "$WITH_CODEX" -eq 1 ]] || [[ -d "${HOME}/.codex/skills" ]]; then
    mkdir -p "$(dirname "$dest_codex")"
    rm -rf "$dest_codex"
    cp -R "$src" "$dest_codex"
    echo "已安装: $dest_codex"
  fi
}

case "$TARGET" in
  viral) install_one "xiaobao-viral-agent" ;;
  video) install_one "xiaobao-video-agent" ;;
  digital) install_one "xiaobao-digital-human" ;;
  router) install_one "xiaobao-router" ;;
  all)
    install_one "xiaobao-viral-agent"
    install_one "xiaobao-video-agent"
    install_one "xiaobao-digital-human"
    install_one "xiaobao-router"
    ;;
esac

echo "凭据: node ~/.agents/skills/xiaobao-digital-human/scripts/setup-credentials.mjs --api-key YOUR_KEY"
