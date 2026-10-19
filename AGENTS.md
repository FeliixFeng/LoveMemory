# AGENTS.md — LoveMemory

给 AI / 协作者的唯一事实来源。与 `CLAUDE.md` 冲突时以本文件为准。

## 这是什么

情侣纪念站（中文 UI，移动端优先）。单页 + API Routes。

- Next.js 15 App Router / React 18 / TypeScript
- Prisma + **SQLite**（MySQL 已废弃，仅迁移时用过）
- 阿里云 OSS 存图（`ali-oss` + `sharp` 生成 480x480 缩略图）
- Tailwind CSS v4（PostCSS 构建，变量在 `app/globals.css`）

## 铁律

1. **数据读写只走 `app/lib/app-data.ts`**，不要在别处直接调 Prisma。
2. **前后端契约同时改**：`lib/types.ts` ↔ `app/api/*` ↔ `hooks/*` ↔ 组件。
3. **不提交** `.env.local` / `.env.production` / `data/*.sqlite*`。
4. **线上数据是唯一真实数据**，任何开发、测试、部署操作都不得覆盖它。

## 数据策略（重点）

### 两套库，互不影响

| | 位置 | 说明 |
|---|---|---|
| 线上 | 服务器 `/data/app/love-memory/data/data.sqlite` | 容器 bind mount 到 `/app/db`，重建镜像不丢 |
| 本地 | 仓库 `data/db.sqlite` | `.env.local` 里 `DATABASE_URL=file:../data/db.sqlite` |

⚠️ **路径陷阱**：Prisma 把 `file:` 相对路径按 `prisma/schema.prisma` 所在目录解析。写 `file:./data/db.sqlite` 会落到 `prisma/data/db.sqlite`（历史上踩过，那里还留着一个 2026-07 的旧副本，可忽略）。

### 本地数据 = 一次性快照，不持续同步

- 2026-10-19 已从线上拉过一次快照（21 事件 / 15 照片 / 5 心愿 / 3 胶囊 / 3 消费）。
- **之后就用这份数据做测试，不再同步**。本地随便增删改，不会影响线上。
- 只有当确实需要一份更新的真实数据时，才手动跑：
  ```bash
  ./scripts/pull-prod-db.sh
  ```
- 这个脚本是**单向、一次性**的（线上 → 本地），不是部署流程的一部分。

### 部署不传数据

- 部署只更新代码：rsync 排除 `data/`、`public/uploads/`、`.env.production`。
- 线上库原地不动，容器重启/重建都读同一份 bind mount 文件。
- 图片不存在本地：本地和线上共用同一个 OSS bucket，**图片天然互通**。

## 开发

```bash
npm install
npm run dev      # http://localhost:3000，predev 会 rm -rf .next
npm test         # node --test，test/api.test.js
npm run build
npm run prisma:generate
```

数据层分支：`STORAGE_DRIVER`（`mysql` / `json`）只影响旧路径，当前实际走 SQLite。

## 部署

**GitHub Actions 已停用**（`.github/workflows/deploy.yml.disabled`）。2026-07-13 连续两次部署失败后手动改名关闭。**`scripts/deploy.sh` 也已删除（2026-10-19）**——部署按下面四步手动执行，每步单独看结果，不要写成脚本一把梭。

### 四步手动部署

```bash
# 1. 本地门禁
npm run typecheck

# 2. 同步代码（排除项一个都不能少，尤其 data/ 和 .env.production）
rsync -az --delete \
  --rsync-path="sudo -u user rsync" \
  --exclude '.git' --exclude '.github' --exclude '.next' --exclude 'node_modules' \
  --exclude 'data' --exclude 'public/uploads' \
  --exclude '.env.local' --exclude '.env.production' \
  --exclude '.DS_Store' --exclude '.idea' --exclude '.claude' \
  --exclude 'tsconfig.tsbuildinfo' \
  ./ ali1:/data/app/love-memory/

# 3. 远程构建并重启（用连字符形式，这台机器提供的是 docker-compose）
ssh ali1 'cd /data/app/love-memory && docker-compose up -d --build'

# 4. 健康检查（容器内 3000 + 外网域名，两边都要过）
ssh ali1 'curl -fsS --retry 10 --retry-delay 3 http://127.0.0.1:3000/api/health'
curl -fsS https://lovexin.felixfeng.online/api/health
```

### 服务器事实

- `ssh ali1` → `root@47.121.181.198`（2核2G，云盘 40G）
- 部署目录 `/data/app/love-memory`（**不是 git 仓库**，纯文件覆盖）
- 容器 `love-memory`，端口 **3000:3000**
- nginx：`lovexin.felixfeng.online` → `127.0.0.1:3000`，Let's Encrypt 证书
- 环境变量只在服务器 `.env.production`：`DATABASE_URL=file:/app/db/data.sqlite`
- 同机还有 `frps`（felixfeng.online 一级域名靠它）；`ali1-new-api` 已于 2026-10-19 移除，3000 归还本项目，其镜像与数据 `/root/apps/new-api/data` 保留，想恢复就去 `/root/apps/new-api` 跑 `docker-compose up -d`

### 事故课：别把云盘 IOPS 打爆（2026-10-19）

当天反复 `docker-compose build`，构建缓存累积到 **7.6GB / 60 条**，21:05 那次构建把云盘 IOPS 打满，整机"半死"：

- **症状**：TCP 能握手但 **SSH 不吐 banner**、VNC 里刷 `Failed to start Journal Service` / `Failed to start Snap Daemon`、nginx 80 正常回包但 443 反代全挂、frp 的一级域名一起挂
- **误判教训**：这不是封 IP / 安全组 / fail2ban——那些会在 TCP 握手阶段就断。**握手成功 + 同机 nginx 还能回包 = 机器内部 IO 卡死**，别去折腾防火墙
- **恢复**：阿里云控制台重启实例（云盘持久化，数据无损，容器 `restart: always` 自己起来）。先别急着重启，能登录就先 `df -h; free -h; docker system df` 留证据

预防规则：

1. **部署前不要清构建缓存**——清了就得全量重建，突发写入反而更大。缓存是保护，不是垃圾
2. `docker system df` 的 **Build Cache 超过 ~3GB** 就清一次 `docker builder prune -af`（只动缓存；**绝不加 `--volumes`**，那会删数据卷）
3. 构建前看一眼 `df -h` / `free -h`：磁盘可用 <5G、可用内存 <300M 先收拾再部署
4. 构建中途别反复中断重来，一次跑完；2核2G 单次全量构建 5~10 分钟属正常
5. 只在本机和服务器各构建一次，不要"改一行就重 build"，反复构建才是打爆 IOPS 的原因

## UI 约定（2026-10 重构后）

### 浮层一律走 `components/ui/Overlay.tsx`

不要自己写 `fixed inset-0` + 遮罩。`Overlay` 已统一处理：锁 body 滚动、点遮罩关闭、Esc 关闭、焦点陷阱、层级。

```tsx
<Overlay onClose={...} layer="modal" panelClassName="...">
  ...
</Overlay>
```

层级常量在 `Z_LAYER`，不要硬编码 z-index：

| 层 | 值 | 用途 |
|---|---|---|
| `nav` | 40 | 顶部导航、底部 tab、悬浮按钮 |
| `sheet` | 50 | 事件详情（移动端底部抽屉） |
| `modal` | 60 | 表单 / PIN / 确认框 |
| `lightbox` | 70 | 图片灯箱 |
| `toast` | 80 | 轻提示 |

配套 hooks：

- `useScrollLock` —— 锁 body 滚动，嵌套计数（详情上再弹确认框不会提前解锁）
- `useOverlayLayer` —— Esc 只关最上面一层（详情 → 灯箱时，Esc 只关灯箱）

### 颜色与字体：只认 token，不写死

**唯一来源是 `app/globals.css` 的 `:root`。** 组件里出现 `#RRGGBB` 或字体名字面量都算 bug（画布/echarts 例外，见下）。

token 通过 `@theme inline` 暴露成 Tailwind 工具类，直接当普通类用，支持透明度修饰：

| token | 工具类 | 用途 | 当前值 |
|---|---|---|---|
| `--lm-bg` | `bg-lm-bg` | 页面底色 | `#FBF8F4` |
| `--lm-line` | `border-lm-line` / `bg-lm-line` | 浅描边、占位色块 | `#EFD8C3` |
| `--lm-ink-strong` | `text-lm-ink-strong` | 大标题、天数数字 | `#2C2420` |
| `--lm-ink` | `text-lm-ink` | 区块标题 | `#3D281C` |
| `--lm-body` | `text-lm-body` | 正文 | `#5C3D2A` |
| `--lm-muted` | `text-lm-muted` | 次要说明 | `#8C7E74` |
| `--lm-accent` | `text-lm-accent` / `bg-lm-accent` | 主强调 | `#CC9266` |
| `--lm-accent-deep` | `*-lm-accent-deep` | 强调渐变深端 | `#AD7C57` |
| `--lm-blush` | `from-lm-blush` | 头像渐变暖粉端 | `#F0C8A8` |

字体同理，只有两个栈：

```tsx
<h2 className="font-serif-cn">区块标题</h2>          {/* Noto Serif SC */}
<span className="font-display">TOGETHER FOR</span>    {/* Playfair Display */}
```

内联样式里需要时用变量：`style={{ fontFamily: 'var(--lm-font-serif)' }}`。

**例外：canvas 不认 CSS 变量。** echarts / canvas 配置里的颜色用不了 `var()`，从 `app/lib/theme.ts` 取常量。改色时**两处同步**（`:root` 和 `theme.ts`），改一行即全站生效。

**透明度不要自己算**：写 `text-lm-body/50`，不要另找一个"50% 的棕色"。

**2026-10-19 决策**：accent 走折中色 `#CC9266`（介于原赤陶 `#D48B60` 与暖金 `#C49A6C` 之间），新旧页面差异最小。clay 已删除。

### 安全区

`viewport-fit=cover` 已开启，任何贴边元素都要留 `env(safe-area-inset-*)`：

- 底部 tab：`pb-[env(safe-area-inset-bottom)]`
- 页面主体：`pb-[calc(5rem_+_env(safe-area-inset-bottom))]`
- 悬浮按钮：`bottom-[calc(64px_+_env(safe-area-inset-bottom))]`
- 浮层面板：`pb-[env(safe-area-inset-bottom)]`

### 首页滚轮行为（有意为之，不要"修复"）

封面与时间轴是一体的：**页面在顶部时**，整块 hero 接管垂直滚轮 → 时间轴横向滚动。

约束（`love-memory-client.tsx`）：

- `window.scrollY > 8` 时完全不接管，避免用户想上滚回封面却被横向滚劫持
- 时间轴到头（最左/最右）时释放，把控制权还给页面，不能"卡死"
- `Ctrl / ⌘ + 滚轮`（缩放）放行
- 触控板横向手势不干预

### 表单提交

保存类操作**成功后再关表单/清草稿**，失败保留用户输入。新增列表项后要自动滚到新条目（参考 `EventDetail` 的账单表单）。

## 已知坑

1. **端口已统一 3000**（2026-10-19 起）：本地与服务器 compose 都是 `3000:3000`，nginx upstream 是 `127.0.0.1:3000`。历史上的 `3001` 是因为 `ali1-new-api` 占着 3000，该服务已移除，**全机无 3001 残留，不要再引入**（改端口要同时改 compose + nginx 两处）。
2. **SQLite WAL**：拷贝数据库必须连 `-wal` / `-shm` 一起，只拷主文件会丢最近的写入。
3. **`predev` 会删 `.next`**：在受限环境里可能被删除保护拦截，此时用 `npx next dev` 跳过 predev。
4. **Agent 环境启动**：若通过 WorkBuddy/CodeBuddy 的 shell 启动，`NODE_OPTIONS` 会注入 fs shim，导致 Next 建 `.next` 时报 `EEXIST`。用 `env -u NODE_OPTIONS npx next dev` 启动；用户自己终端里 `npm run dev` 不受影响。
5. **`CLAUDE.md` / `README.md` 里的 MySQL 描述已过期**，以本文件为准。
6. **配色仍是两套**：4 个文件用新暖金（NavBar / BottomTabBar / EventPreviewCard / FloatingAddButton），其余 16 个文件仍是旧赤陶。统一方案见 `PLAN.md`，改之前不要随手加新的硬编码色值。

## 目录

```
app/(site)/     首页 / album / capsule / footprint / wishes / more
app/api/        auth(PIN) data upload events expenses capsules wishes health
app/lib/        app-data.ts（数据层）prisma.ts oss.ts auth.ts schemas.ts env.ts
components/     UI（love-memory-client.tsx 是主客户端组件）
components/ui/  Overlay（统一浮层）
hooks/          useAppData / useEventCRUD / useExpenseCRUD / usePhotoUpload
                useScrollLock / useOverlayLayer
prisma/         schema.prisma（provider = sqlite）
data/           本地 SQLite（gitignore）
scripts/        pull-prod-db.sh（部署脚本已删，手动四步见「部署」章）
PLAN.md         分阶段优化计划
```
