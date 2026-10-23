#!/usr/bin/env python3
"""
幂等迁移：给 events 加 wish_id / capsule_id 两列（含唯一索引）。

为什么是 Python 而不是 Node：生产容器是 node:20-alpine，
没有 node:sqlite（Node 22.5+ 才有）。宿主机有 python3，直接读挂载的
data 目录最稳，也不用把脚本 cp 进容器。

本地已用 prisma db push 应用过，这里跑应该是 no-op。
重复执行不会报错。

    python3 scripts/migrate.py                      # 自动找库
    DB_PATH=/path/to/data.sqlite python3 scripts/migrate.py
"""
import json
import os
import sqlite3
import sys

DEFAULT_PROD = "/data/app/love-memory/data/data.sqlite"
DEFAULT_LOCAL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "db.sqlite")

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


before = {"wish": has_column("events", "wish_id"), "capsule": has_column("events", "capsule_id")}

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

cur.execute('CREATE UNIQUE INDEX IF NOT EXISTS "events_wish_id_key" ON "events"("wish_id")')
cur.execute('CREATE UNIQUE INDEX IF NOT EXISTS "events_capsule_id_key" ON "events"("capsule_id")')
con.commit()

after = {"wish": has_column("events", "wish_id"), "capsule": has_column("events", "capsule_id")}
cur.execute("SELECT COUNT(*) FROM events")
events = cur.fetchone()[0]
con.close()

print(json.dumps({"ok": after["wish"] and after["capsule"], "path": path, "before": before, "after": after, "events": events}, ensure_ascii=False))
