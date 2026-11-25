#!/usr/bin/env python3
"""
幂等迁移：
1. events 加 wish_id / capsule_id 两列（含唯一索引）
2. settings 加 couple_names / home_city
3. events 加 end_date / city（首次加 city 列时，按 location 自动回填老数据的 city）

为什么是 Python 而不是 Node：生产容器是 node:20-alpine，
没有 node:sqlite（Node 22.5+ 才有）。宿主机有 python3，直接读挂载的
data 目录最稳，也不用把脚本 cp 进容器。

    python3 scripts/migrate.py                      # 自动找库
    DB_PATH=/path/to/data.sqlite python3 scripts/migrate.py
"""
import json
import os
import re
import sqlite3
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PROD = "/data/app/love-memory/data/data.sqlite"
DEFAULT_LOCAL = os.path.join(ROOT_DIR, "data", "db.sqlite")

path = os.environ.get("DB_PATH")
if not path:
    path = DEFAULT_PROD if os.path.exists(DEFAULT_PROD) else DEFAULT_LOCAL

if not os.path.exists(path):
    print(json.dumps({"ok": False, "error": "database not found", "path": path}, ensure_ascii=False))
    sys.exit(1)

con = sqlite3.connect(path, timeout=15)
cur = con.cursor()


def has_column(table: str, column: str) -> bool:
    cur.execute("PRAGMA table_info(%s)" % table)
    return any(row[1] == column for row in cur.fetchall())


def load_city_keys() -> list[str]:
    """从 lib/map-data.ts 提取已知城市与景点名，按长度降序排列用于安全匹配。"""
    map_data_path = os.path.join(ROOT_DIR, "lib", "map-data.ts")
    keys: set[str] = set()
    if os.path.exists(map_data_path):
        with open(map_data_path, "r", encoding="utf-8") as f:
            content = f.read()
        # 提取 CITY_TO_PROVINCE 段里的单引号键名
        block = content.split("export const CITY_COORDS")[0]
        for m in re.finditer(r"'([^']+)'\s*:\s*'([^']+)'", block):
            keys.add(m.group(1))
    return sorted(keys, key=len, reverse=True)


# 常见地标/景区归一化到主城市（仅用于初次迁移回填）
CITY_ALIASES = {
    "东坡赤壁": "黄冈",
    "外滩": "上海",
    "迪士尼": "上海",
    "故宫": "北京",
    "长城": "北京",
    "西湖": "杭州",
}


def infer_city(location: str, city_keys: list[str]) -> str:
    raw = re.sub(r"[\s\u3000]+", " ", (location or "")).strip()
    if not raw or raw in ("待定", "未定", "暂无", "未知", "家里"):
        return ""
    for alias, target in CITY_ALIASES.items():
        if alias in raw:
            return target
    for key in city_keys:
        if key in raw:
            return key
    return ""


before = {
    "wish": has_column("events", "wish_id"),
    "capsule": has_column("events", "capsule_id"),
    "names": has_column("settings", "couple_names"),
    "home_city": has_column("settings", "home_city"),
    "end_date": has_column("events", "end_date"),
    "city": has_column("events", "city"),
}

if not before["wish"]:
    cur.execute(
        'ALTER TABLE "events" ADD COLUMN "wish_id" INTEGER '
        'REFERENCES "wishes" ("id") ON DELETE SET NULL ON UPDATE CASCADE'
    )
if not before["capsule"]:
    cur.execute(
        'ALTER TABLE "events" ADD COLUMN "capsule_id" INTEGER '
        'REFERENCES "capsules" ("id") ON DELETE SET NULL ON UPDATE CASCADE'
    )
if not before["names"]:
    cur.execute('ALTER TABLE "settings" ADD COLUMN "couple_names" TEXT NOT NULL DEFAULT \'[]\'')
if not before["home_city"]:
    cur.execute('ALTER TABLE "settings" ADD COLUMN "home_city" TEXT NOT NULL DEFAULT \'\'')
if not before["end_date"]:
    cur.execute('ALTER TABLE "events" ADD COLUMN "end_date" TEXT NOT NULL DEFAULT \'\'')
if not before["city"]:
    cur.execute('ALTER TABLE "events" ADD COLUMN "city" TEXT NOT NULL DEFAULT \'\'')
    # 首次增加 city 列时，按历史 location 回填城市，保证已有足迹无缝衔接
    city_keys = load_city_keys()
    cur.execute('SELECT id, location FROM "events"')
    for ev_id, loc in cur.fetchall():
        inferred = infer_city(loc or "", city_keys)
        if inferred:
            cur.execute('UPDATE "events" SET "city" = ? WHERE "id" = ?', (inferred, ev_id))

cur.execute('CREATE UNIQUE INDEX IF NOT EXISTS "events_wish_id_key" ON "events"("wish_id")')
cur.execute('CREATE UNIQUE INDEX IF NOT EXISTS "events_capsule_id_key" ON "events"("capsule_id")')
con.commit()

after = {
    "wish": has_column("events", "wish_id"),
    "capsule": has_column("events", "capsule_id"),
    "names": has_column("settings", "couple_names"),
    "home_city": has_column("settings", "home_city"),
    "end_date": has_column("events", "end_date"),
    "city": has_column("events", "city"),
}
cur.execute("SELECT COUNT(*) FROM events")
events = cur.fetchone()[0]
con.close()

print(json.dumps({
    "ok": all(after.values()),
    "path": path,
    "before": before,
    "after": after,
    "events": events,
}, ensure_ascii=False))
