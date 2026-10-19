#!/usr/bin/env bash
# 手动部署：同步代码 -> 远程重建容器 -> 健康检查
#
# 用法： ./scripts/deploy.sh
# 环境： LM_SSH_HOST（默认 ali1）
#
# 重要：本脚本只同步代码，不碰线上数据
#   - 排除 data/          （线上 SQLite 原地不动）
#   - 排除 public/uploads/（本地上传目录不覆盖）
#   - 排除 .env.production（服务器环境变量唯一来源）

set -euo pipefail

HOST="${LM_SSH_HOST:-ali1}"
REMOTE="/data/app/love-memory"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  工作区有未提交改动，这些改动也会被部署。"
  git status --short
  printf "继续？[y/N] "
  read -r ans
  [ "$ans" = "y" ] || exit 1
fi

echo "→ 本地 typecheck（部署前门禁）"
npm run typecheck

echo "→ 同步代码到 $HOST:$REMOTE (不含数据)"
rsync -az --delete \
  --rsync-path="sudo -u user rsync" \
  --exclude '.git' \
  --exclude '.github' \
  --exclude '.next' \
  --exclude 'node_modules' \
  --exclude 'data' \
  --exclude 'public/uploads' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  --exclude '.DS_Store' \
  --exclude '.idea' \
  --exclude '.claude' \
  --exclude 'tsconfig.tsbuildinfo' \
  ./ "$HOST:$REMOTE/"

echo "→ 远程重建并启动"
ssh "$HOST" "cd $REMOTE && docker compose up -d --build"

echo "→ 健康检查（127.0.0.1:3001）"
ssh "$HOST" 'curl -fsS --retry 10 --retry-delay 3 http://127.0.0.1:3001/api/health'
echo
echo "✓ 部署完成：https://lovexin.felixfeng.online"
