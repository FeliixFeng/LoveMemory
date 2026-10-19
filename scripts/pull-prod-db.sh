#!/usr/bin/env bash
# 拉取线上 SQLite 快照到本地开发库（只读方向：线上 -> 本地）
#
# 用法： ./scripts/pull-prod-db.sh
# 环境： LM_SSH_HOST（默认 ali1）
#
# 说明：
#   - 线上库在 /data/app/love-memory/data/data.sqlite，是容器 bind mount 出来的
#   - 本地库写在 <repo>/data/db.sqlite，对应 .env.local 的 file:../data/db.sqlite
#   - WAL 模式必须连 -wal / -shm 一起拷，只拷主文件会丢最近的写入
#   - 覆盖本地库前请先停掉 npm run dev，避免句柄占用

set -euo pipefail

SSH_HOST="${LM_SSH_HOST:-ali1}"
REMOTE_DIR="/data/app/love-memory/data"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/data"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ 从 $SSH_HOST:$REMOTE_DIR 拉取快照"
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && tar cf - data.sqlite data.sqlite-wal data.sqlite-shm 2>/dev/null" \
  | tar xf - -C "$TMP"

if [ ! -f "$TMP/data.sqlite" ]; then
  echo "✗ 没拿到 data.sqlite，检查 ssh 连通和远端路径" >&2
  exit 1
fi

mkdir -p "$DEST"
rm -f "$DEST/db.sqlite-wal" "$DEST/db.sqlite-shm"
mv -f "$TMP/data.sqlite" "$DEST/db.sqlite"
[ -f "$TMP/data.sqlite-wal" ] && mv -f "$TMP/data.sqlite-wal" "$DEST/db.sqlite-wal"
[ -f "$TMP/data.sqlite-shm" ] && mv -f "$TMP/data.sqlite-shm" "$DEST/db.sqlite-shm"

echo "✓ 已写入 $DEST/db.sqlite"
echo "  下一步：npm run dev"
