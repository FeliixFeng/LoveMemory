# AGENTS.md — LoveMemory

给 AI / 协作者的唯一事实来源。与 `CLAUDE.md` 冲突时以本文件为准。

## 这是什么

情侣纪念站（中文 UI，移动端优先）。单页 + API Routes。

- Next.js 15 App Router / React 18 / TypeScript
- Prisma + **SQLite**（MySQL 已废弃，仅迁移时用过）
- 阿里云 OSS 可选存图（`ali-oss`；未配置自动落盘 `public/uploads`），`sharp` 生成 480x480 缩略图
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
- 照片互通：配置了 OSS 的实例共用一个 bucket；默认封面（`public/hero/`）随代码仓库走，不在 OSS。

### 图片存储契约（2026-10-21 起）

**默认资产进仓库，实例数据走宿主存储**——产品（含给别人部署）开箱即用，不依赖作者的云账号。

- **默认封面随仓库分发**：`public/hero/hero{1-6}-{mobile,web}.jpg`（竖 4:5 / 横 16:9），`lib/constants.ts` 的 `HERO_SLIDES` 引用。OSS 上不存封面；缓存规则：路径永不复用，覆盖同名才补 `?v=YYYYMMDD`。
- **上传落点契约**（`app/api/upload/route.ts`）：原图 `photos/<时间戳>_<随机>.<ext>`，缩略图 `thumbs/<同名>`（扁平）。配了 OSS → 桶内同结构；没配 → `public/uploads/` 同结构（Next 静态服务 `/uploads/*`，compose 卷 `./public/uploads` 持久化）。**桶根目录禁止落裸文件**——2026-10-21 已清理一代散图（含 7MB 未压缩原图）。
- **压缩双保险**：客户端 `browser-image-compression`（≤1.5MB / 长边 2048；压缩失败会原样上传）；服务端 `capImageSize` 兜底 >2MB JPEG/WebP → 长边 2560 / 质量 80。
- **删除顺序**：先删文件成功、再删库行（反序失败会留孤儿）；删除 key 用 URL 完整路径，不要 `basename`（会剥掉 `photos/` 前缀删错对象）。
- 无 OSS 部署整站可用（浏览/事件/心愿/胶囊/账单/照片上传全功能），OSS 只是存储宿主选项。

### 数据写路径契约（2026-10-20 收窄后，不要回退）

**`POST /api/data` 只接受 settings 字段**（`SettingsPatchSchema`，strict）：`startDate / heroImage / customCovers / hiddenDefaultCovers / countdowns / loveQuotes`。传 `events / photos / expenses / wishes / capsules` 等一律 **400**——这是防删库的硬闸门，回归测试盯着（`test/api.test.js`）。

各实体的增删改走**资源接口**：

| 接口 | 用途 |
|---|---|
| `/api/events`、`/api/events/[id]` | 事件 CRUD（级联账单，照片脱钩保留） |
| `/api/expenses/[id]` | 账单 |
| `/api/wishes`、`/api/capsules` | 心愿 / 胶囊 |
| `/api/upload` | 照片上传/删除（photos/ 目录契约 + 缩略图，见「图片存储契约」） |
| `PUT /api/photos/order` | 照片重排：**只更新 sortOrder，零删除** |

数据层（`app/lib/app-data.ts`）只有 `writeSettings()` 一个批量写入口；旧的 `writeAppData`（`deleteMany({notIn})` 整份覆盖）已删除，**不要复活类似模式**。

**前端数据流**：`app/(site)/layout.tsx`（server，`force-dynamic`）每请求 `readAppData()` 直出给 `AppDataProvider`（`hooks/useAppData.tsx`）；页面经 `useAppData()` 消费同一份 context。写操作 = 乐观 `setData` + 资源接口 / `saveSettings(patch)`，失败时 `loadData()` 回滚。切 tab 不重新拉数据。

**Auth**：`APP_PIN` 启用 PIN；token 用 `APP_SECRET` HMAC 签名（90 天），缺省回退 PIN 并打一次警告。PIN 按 IP 限流：5 分钟内错 5 次锁 5 分钟（429 + Retry-After）。前端 `PinModal` 透出服务端错误文案（含 429 的「尝试次数过多」与等待秒数），不是只抖一下。`test/auth.test.js` 覆盖。

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
#    注意：根目录排除必须写成 /data（前导斜杠=只锚定传输根），写 data 会连 app/api/data/ 一起排掉
rsync -az --delete \
  --rsync-path="sudo -u user rsync" \
  --exclude '.git' --exclude '.github' --exclude '.next' --exclude 'node_modules' \
  --exclude '/data' --exclude 'public/uploads' \
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

> **APP_SECRET（2026-10-20 新增）**：token 签名密钥已从 PIN 独立出来。rsync 不传 `.env.production`，所以**首次部署这批代码前**要手动给服务器补一行（随机长字符串，只执行这一次）：
> `ssh ali1 'echo "APP_SECRET=$(openssl rand -hex 32)" >> /data/app/love-memory/.env.production'`
> 不配也能跑（回退用 PIN 签名并打告警），但配上后 PIN 泄露不会波及已签发 token。注意：配好后旧 token 全部失效，用户需重输一次 PIN。

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

### 心愿 / 胶囊：URL 即 tab 状态（2026-10-20 起）

`/wishes` 与 `/capsule` 渲染同一组件 `WishesCapsulesPage`，当前 tab **由 pathname 派生**（`pathname === '/capsule' ? 'capsules' : 'wishes'`），页内切换 = `router.push`。底部 tab 在 `/capsule` 时仍高亮「心愿」。不要改回组件内 `useState`——分享链接直达、刷新保持都会失效。

### 导航与封面（有意为之，不要"修复"）

- **手机端导航栏随滚动隐藏**：向下滚收起、向上滚回来、顶部常显；桌面端常显（没有底部 tab 兜底）
- **封面 `max-h-[70dvh]`**：矮屏（笔记本 / 小屏手机）封面不再独占首屏，高屏维持原 aspect 比例

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
5. **dev 与 prod 不能同时跑**：`next dev` 和 `next build`/`start` 抢同一个 `.next` 目录，会写坏（症状：`Cannot find module './xxx.js'`）。起 prod 前先停 dev；坏了就 `rm -rf .next` 重建（2026-10-20 踩过）。
6. ~~配色两套~~ 已统一（2026-10-19，token 见 UI 约定章）。
7. **rsync 排除模式不锚定会误伤同名目录**（2026-10-20 踩过）：`--exclude 'data'`（无前导斜杠）按"任意层级匹配名为 data 的项"处理，`app/api/data/` 被连带排除，该目录 7月13日后从未同步，部署时远程 build 直接红。根目录排除一律写 `/data`。诊断法：远程文件 mtime 异常旧 = 它没被 rsync 碰过。

## 目录

```
app/(site)/     首页 / album / capsule / footprint / wishes / more
                layout.tsx（server）每请求 readAppData() 直出给 Provider
                loading.tsx（tab 切换的骨架屏 + 心跳动画）
app/api/        auth(PIN) data(upload收窄) upload events expenses capsules wishes photos/order health
app/lib/        服务端/数据层：app-data.ts prisma.ts oss.ts auth.ts schemas.ts env.ts api-client.ts theme.ts
lib/            客户端共享：types.ts constants.ts utils.ts map-data.ts（省市映射/城市坐标/省份全称）
                （组件引用 ../lib/，与 app/lib/ 是两套，别合并）
components/     UI（love-memory-client.tsx 是首页主客户端组件）
components/ui/  Overlay（统一浮层：滚动锁/焦点陷阱/层级/sheet拖拽）
hooks/          useAppData（Provider+context，布局级共享缓存）
                useEventCRUD / useExpenseCRUD / usePhotoUpload
                useScrollLock / useOverlayLayer
test/           api.test.js auth.test.js（node --test，不依赖测试框架）
prisma/         schema.prisma（provider = sqlite）
public/hero/    默认封面（双规格，随仓库分发）
public/uploads/ 本地上传落盘（gitignore；配了 OSS 则不用）
data/           本地 SQLite（gitignore）
scripts/        pull-prod-db.sh（部署脚本已删，手动四步见「部署」章）
PLAN.md         分阶段优化计划（阶段 0-4 已全部完成，历史记录）
```
