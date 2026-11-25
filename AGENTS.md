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

- **默认封面随仓库分发**：`public/hero/hero{1-6}-{mobile,web}.jpg`（竖 1536×2730 9:16 / 横 2730×1536 16:9），`lib/constants.ts` 的 `HERO_SLIDES` 引用。OSS 上不存封面；缓存规则：路径永不复用，覆盖同名才补 `?v=YYYYMMDD`。
- **上传落点契约**（`app/api/upload/route.ts`）：原图 `photos/<时间戳>_<随机>.<ext>`，缩略图 `thumbs/<同名>`（扁平）。配了 OSS → 桶内同结构；没配 → `public/uploads/` 同结构（Next 静态服务 `/uploads/*`，compose 卷 `./public/uploads` 持久化）。**桶根目录禁止落裸文件**——2026-10-21 已清理一代散图（含 7MB 未压缩原图）。
- **压缩双保险**：客户端 `browser-image-compression`（≤1.5MB / 长边 2048；压缩失败会原样上传）；服务端 `capImageSize` 兜底 >2MB JPEG/WebP → 长边 2560 / 质量 80。
- **前端分层展示契约（2026-11-25 起）**：所有列表封面、网格、地图卡片与设置缩略预览走 `lib/image.ts`（`getPhotoThumbUrl` / `resolveEventCoverUrls` / `deriveThumbFromUrl` + `fallbackSrc`）；`components/SafeImage.tsx` 自动对外部 HTTPS/HTTP（OSS CDN）与 `/uploads/thumbs/` 设置 `unoptimized`，绕过部署机 `/_next/image` 带宽/CPU 瓶颈。仅 `HeroSection` 与 `Lightbox` 展示原图，且 `Lightbox` 以缩略图即时垫底预览后再无感切换原图。
- **删除顺序**：先删文件成功、再删库行（反序失败会留孤儿）；删除 key 用 URL 完整路径，不要 `basename`（会剥掉 `photos/` 前缀删错对象）。
- 无 OSS 部署整站可用（浏览/事件/心愿/胶囊/账单/照片上传全功能），OSS 只是存储宿主选项。

### 数据写路径契约（2026-10-20 收窄后，不要回退）

**`POST /api/data` 只接受 settings 字段**（`SettingsPatchSchema`，strict）：`startDate / heroImage / customCovers / hiddenDefaultCovers / coupleNames / homeCity / countdowns / loveQuotes`。传 `events / photos / expenses / wishes / capsules` 等一律 **400**——这是防删库的硬闸门，回归测试盯着（`test/api.test.js`）。

各实体的增删改走**资源接口**：

| 接口 | 用途 |
|---|---|
| `/api/events`、`/api/events/[id]` | 事件 CRUD（级联账单，照片脱钩保留） |
| `/api/expenses/[id]` | 账单 |
| `/api/wishes`、`/api/capsules` | 心愿 / 胶囊 |
| `/api/upload` | 照片上传/删除（photos/ 目录契约 + 缩略图，见「图片存储契约」） |
| `PUT /api/photos/order` | 照片重排：**只更新 sortOrder，零删除** |

数据层（`app/lib/app-data.ts`）只有 `writeSettings()` 一个批量写入口；旧的 `writeAppData`（`deleteMany({notIn})` 整份覆盖）已删除，**不要复活类似模式**。

**前端数据流**：`app/(site)/layout.tsx`（server，`force-dynamic`）每请求 `readAppData()` 直出给 `AppDataProvider`（`hooks/useAppData.tsx`）；页面经 `useAppData()` 消费同一份 context。切 tab 不重新拉数据。

**写操作一律走 `mutate(optimistic, request, opts)`**（`hooks/useAppData.tsx`）：乐观改本地 → 发资源接口 → 失败用快照回滚 + toast → 401 弹 PIN 后自动重放同一次变更。不要在 hook 里各写一套 try/catch —— `useEventCRUD` 的编辑分支就是因为漏了 PUT，改完看着保存成功、刷新回原样。

**胶囊封存在服务端**（2026-10-23）：`readAppData()` 按 `unlockDate` 把未解锁胶囊的 `content` 置空、`locked: true`。`/api/data` 和 `/api/capsules` 都走这里，所以只改一个路由不够。前端只认 `locked`，不要自己拿日期算。

**地点只有一处解析**（2026-10-23；2026-11-25 扩展 `Event.city` 与 `Settings.homeCity`）：所有地点计算走 `lib/place.ts` 的 `resolvePlace / resolveEventPlace / placeLabel / collectPlaces`。不要再写 `location.includes(city)` 或 `excludedWords` 黑名单 —— 首页统计、足迹地图、事件弹窗三处曾经各算各的，同一个「武汉 江汉路」得出三种结果。解析不出的（家里 / 待定 / 海边）或显式设为日常的事件不上地图，但 `placeLabel` 会保留原文，仍然算一个「地方」。

**来源链接**：`Event.wishId` / `Event.capsuleId`（可空、唯一）。愿望完成或胶囊开启后由前端调 `POST /api/events` 带上来源，一条来源只能对应一条回忆。

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

### ⚠️ 开工前三个硬前置（2026-11-09 第二次事故后提到最前）

**部署不是"跑四条命令"**。这台机器 2核2G + 40G 云盘，**瓶颈是云盘 IOPS**，构建把它打满会让整机半死：SSH 握手成功但不吐 banner、443 反代全挂、同机 frps 一起挂（完整症状与恢复见本章末尾「事故课」）。以下三条**每次部署前逐条确认，不许跳**：

1. **先看资源**（在动任何东西之前）
   ```bash
   ssh ali1 'df -h /; free -h; docker system df'
   ```
   磁盘可用 <5G、可用内存 <300M 先收拾；Build Cache >3GB 先 `docker builder prune -af`（只清缓存，**绝不加 `--volumes`**、绝不 `image prune -a`）。**不要"顺便清空构建缓存"**——清了就全量重建，突发写入更大。

2. **rsync 必须先 `-n` 空跑**
   ```bash
   rsync -azn --delete <同样的排除项> ./ ali1:/data/app/love-memory/     # 先 n
   ```
   确认「将被删除」清单里只有构建产物和过期文件，再去掉 `n` 真跑。`--delete` 配错排除项是**唯一能一次性毁掉线上数据**的操作。

3. **先声明耗时，启动构建，然后只读日志播报**
   2核2G 全量构建 **5~10 分钟属正常**；**有构建缓存时只要 2~3 分钟**（2026-11-09 实测）。构建期间：
   - **不许并发 `curl` / `ssh` 探测**（每次探测本身都在抢 IO，机器越忙越慢）
   - **不许中途取消重来**（反复中断是 10-19 打爆 IOPS 的直接原因）
   - **必须每 2~3 分钟主动播报一次进度**，内容从远端日志文件 `tail` 读，而不是新开连接去「探活」

   > **沉默不是稳重，在运维场景里沉默就是故障信号。** 2026-11-09 第三次部署时，构建其实 2 分钟就成功了，但执行方挂了一个 9 分钟的阻塞等待、全程零输出，操作者判定「又卡死了」并中断任务——虽然这次没造成损失，但误判就是这样产生的。读日志播报的成本是几十字节输出，不播报的代价是操作者做出错误决策。

违反任一条都可能重演整机卡死。**部署是运维动作，不是敲命令。**

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

# 3. 数据库迁移（只在 schema 有变更时需要；幂等，可重复跑）
#    在宿主机用 python3 直连挂载目录 —— 容器是 node:20，没有 node:sqlite
#    加列向后兼容，旧容器在迁移期间照常服务
ssh ali1 'cd /data/app/love-memory && python3 scripts/migrate.py'

# 4. 远程构建并重启（用连字符形式，这台机器提供的是 docker-compose）
#    必须脱离 ssh 会话：setsid + nohup + 日志文件。这样断线、Ctrl-C、取消后台任务
#    都不会打断构建——2026-11-09 第二次事故就是 ssh 断开把构建拦腰截断
ssh ali1 'cd /data/app/love-memory && mkdir -p /data/logs && \
  setsid nohup docker-compose up -d --build > /data/logs/deploy-$(date +%Y%m%d-%H%M%S).log 2>&1 < /dev/null & \
  sleep 3; echo "已启动，日志: $(ls -t /data/logs/deploy-*.log | head -1)"'

# 4.1 之后只看日志文件播报进度，不要反复连 ssh 探测
ssh ali1 'tail -20 "$(ls -t /data/logs/deploy-*.log | head -1)"'
#     成功标志：#18 writing image ... done → Container love-memory Recreate → Started

# 5. 健康检查（容器内 3000 + 外网域名，两边都要过）
ssh ali1 'curl -fsS --retry 10 --retry-delay 3 http://127.0.0.1:3000/api/health'
curl -fsS https://lovexin.felixfeng.online/api/health
```

> **schema 变更清单**：`events` 的 `wish_id` / `capsule_id`、`end_date`、`city`，以及 `settings` 的 `couple_names`、`home_city`，均由 `scripts/migrate.py` 幂等负责。**跳过这一步，新代码一查对应字段就 500**（Prisma 会 select 不存在的列）。服务器上没有 prisma CLI，且容器是 Node 20（无 `node:sqlite`），所以用宿主机的 python3 直连 `/data/app/love-memory/data/data.sqlite`。

> **APP_SECRET（2026-10-20 新增）**：token 签名密钥已从 PIN 独立出来。rsync 不传 `.env.production`，所以**首次部署这批代码前**要手动给服务器补一行（随机长字符串，只执行这一次）：
> `ssh ali1 'echo "APP_SECRET=$(openssl rand -hex 32)" >> /data/app/love-memory/.env.production'`
> 不配也能跑（回退用 PIN 签名并打告警），但配上后 PIN 泄露不会波及已签发 token。注意：配好后旧 token 全部失效，用户需重输一次 PIN。

### 备份与回滚（2026-10-22 补）

**部署前必须备份**，三份快照 + 一个镜像标签，成本几十秒：

```bash
TS=$(date +%Y%m%d-%H%M%S)
ssh ali1 "
  set -e; mkdir -p /data/backups; cd /data/app/love-memory
  tar czf /data/backups/lm-src-\$TS.tar.gz --exclude=node_modules --exclude=.next --exclude=data --exclude=public/uploads .
  tar czf /data/backups/lm-data-\$TS.tar.gz data            # WAL 三个文件必须一起，否则丢最近写入
  tar czf /data/backups/lm-uploads-\$TS.tar.gz public/uploads
  docker tag love-memory-app:latest love-memory-app:rollback-\$TS
"
```

**rsync 先 `-n` 空跑一遍**，确认「将被删除」清单里只有构建产物和过期文件，再去掉 `n` 真跑。`--delete` 配错排除项是唯一能一次性毁掉线上数据的操作。

回滚分三档，按出问题的层次选：

```bash
# 1) 代码（改错文案、某页白屏）
ssh ali1 'cd /data/app/love-memory && tar xzf /data/backups/lm-src-<TS>.tar.gz && docker-compose up -d --build'

# 2) 镜像（新镜像起不来，要最快恢复）
ssh ali1 'cd /data/app/love-memory && docker tag love-memory-app:rollback-<TS> love-memory-app:latest && docker-compose up -d --no-build'

# 3) 数据（误删事件/照片）—— 会丢掉备份点之后的所有写入，先确认再执行
ssh ali1 'cd /data/app/love-memory && docker-compose stop && rm -rf data && tar xzf /data/backups/lm-data-<TS>.tar.gz && docker-compose start'
```

**禁忌**：`docker-compose down -v`（删数据卷）、`docker image prune -a` / `docker system prune -a`（波及同机其他项目）、不带排除项的 `rsync --delete`、在 `/data/app/love-memory` 之外执行 compose 命令。

> `docker compose`（空格、插件形式）**在这台机器上不可用**，只有连字符的 `docker-compose`（`/usr/local/bin/docker-compose`，v2.24.1 独立版）。别照着别处的文档写成空格形式。

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

**2026-11-09 第二次同样事故**（同一个坑，隔了三周又踩）：`docker-compose up -d --build` 启动后第 6 分钟（仍在 5-10 分钟正常区间内），因"看起来卡住"取消了后台任务 → ssh 断 → 构建被打断；随后为确认状态又连续 `curl` + `ssh` 探测六七次，机器进入与 10-19 完全相同的状态（SSH 握手成功、banner 不出、443 全挂）。

根因不是技术，是流程：

- 危险提示原本只在章末「事故课」，而可执行命令在章首 → **读的人永远先读到命令**。已把「三个硬前置」提到章首
- 用本地 M3 的时间感（40 秒）判断 2核2G（5-10 分钟），把"正常"当"卡死"
- 忘了 `rsync` 的 `-n` 空跑（那次没出事是运气）
- 中断后继续探测 = 在已经 IO 打满的机器上继续加 IO

排查提示：`~/.ssh/config` 开了 `ControlMaster`（`ControlPersist 10m`），机器卡住时旧 master socket 会残留，新 `ssh` 可能**秒退且无任何输出**（看起来像"命令没执行"，其实是复用了死连接）。判断机器真活的可靠办法是抓 banner，别信 ssh 的静默返回：

```bash
nc -w 8 47.121.181.198 22 | head -c 40     # 能读到 SSH-2.0-... 才是真活着
ssh -o ControlPath=none ali1 'uptime'      # 绕过复用，强制新建连接
```

### 2026-11-09 同日第三次：确认可行的配方（约 2 分钟）

这次成功把前两次的根因坐实了——问题不在机器性能，在构建方式。

| 条件 | 做法 |
|:--|:--|
| 构建缓存 | **保留 5.28GB 不清** |
| 进程关系 | `setsid nohup ... > /data/logs/deploy-*.log 2>&1 < /dev/null &`，完全脱离 ssh 会话 |
| 观察方式 | 只 `tail` 远端日志文件，不新开连接探活 |
| 结果 | 镜像构建 + 容器重建 **约 2 分钟**，load 未起峰，未复现卡死 |

**结论，以后照这个来：**

- 前两次失败的真正组合是「**全量构建 + 中途中断 + 中断后反复探测**」，三条凑齐才炸
- **保留缓存 = 增量构建 = 写盘量小一个数量级**。这是保护这台机器最有效的一招，所以「顺便清个缓存」是反效果
- 构建**绝不能依赖 ssh 会话存活**。`setsid nohup` + 日志文件是硬要求，不是优化

### 2026-11-25 补充课：未限流构建写爆 Swap（即使保留缓存也会踩）

2026-11-25 部署虽然完整保留了缓存且未中断，但因为修改了 `prisma/schema.prisma` 触发层失效 + ECharts 重编译，当时可用内存仅 **809Mi**，`next build` 默认多进程无上限吃内存并写爆 2G Swap，把 44 秒的编译拖成 **17 分钟** 并再度打爆云盘 IOPS。

**永久硬预防措施（已固化到代码仓库）：**
1. `Dockerfile` 的 builder 阶段强制加上 `NODE_OPTIONS="--max-old-space-size=640"` 与 `NEXT_TELEMETRY_DISABLED=1`；
2. `next.config.mjs` 开启 `experimental: { cpus: 1, webpackMemoryOptimizations: true, webpackBuildWorker: true }`，压低构建期峰值内存；
3. 构建前若 `free -h` 可用内存不足 1G，先 `docker stop freellmapi`（不动 `frps`），等 `love-memory` 重建完成后再 `docker start freellmapi`。

### 新坑：控制台重启卡在「停止中」

2026-11-09 第二次事故后的恢复过程，又踩到一个：

- **现象**：控制台点「重启 / 停止」后一直转「停止中」；再点「强制停止」报错
  `The current status of the instance does not support this operation. The expected status is in (Running;Paused)`
- **原因**：实例处于 `Stopping` 中间态，阿里云状态机只允许从 `Running`/`Paused` 发起强停。而 OS 侧有进程卡在 **D 状态**（不可中断睡眠，内核里等磁盘 IO 返回），`SIGTERM` / `SIGKILL` 对它全部无效，ACPI 关机流程永远走不完——**上层等 OS，OS 等 IO，IO 在排队**
- **处理顺序（从轻到重）**：
  1. 关掉控制台标签页重开，确认不是页面状态滞后（有时任务早失败，页面还挂着旧状态）
  2. **CloudShell** 里绕过 UI 前置校验：`aliyun ecs StopInstance --InstanceId <id> --ForceStop true`（CloudShell 的 aliyun CLI 已带当前账号凭证，不用配 AccessKey）
  3. 提工单：「实例卡在 Stopping 超 X 分钟，强停报状态不支持」，后台可直接重置实例状态
  4. 什么都不做，等云侧停止任务超时回退（十几分钟到半小时，不是永久锁死）
- **数据风险**：云盘已落盘的数据不丢；仅可能丢失未 flush 的脏页，ext4 journal 下次启动会 replay。本次事故中 `data/` 全程未被写入，零损失
- **禁忌**：焦虑时不要点「释放实例」。那是销毁，不是重启


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
- **封面高度由视口决定，不要用 `aspect-ratio`**（2026-11-09 定）：`HeroSection.tsx` 用 `h-[clamp(...,svh,...)]` 三档（移动 / md / lg），宽度恒 100%。以前用 `aspect-[3/4] md:aspect-[4/3] lg:aspect-[2/1]` 配 `max-h-[70dvh]`，高度触顶后浏览器会按比例**反算宽度**，导致约 460–760px 视口区间封面比下面的事件卡片窄、两者不再同步缩放。**别加回 `aspect-*` 或 `max-h`**。
- **封面内文字定位不能用百分比 `pt-[..%]`**：`padding` 百分比按**宽度**算，封面改成高度驱动后定位会漂（曾把 `2871` 推到时间线上）。用固定值 `pt-10 md:pt-8`。
- 选 `svh` 不选 `dvh`：`dvh` 随手机浏览器地址栏收缩变化，封面会来回跳。

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
4. **Agent 环境启动 / 构建**：若通过 WorkBuddy/CodeBuddy 的 shell 启动，`NODE_OPTIONS` 会注入 fs shim，`next dev` 建 `.next` 时报 `EEXIST`，`next build` 则到处写 `.next` 时断在 `write EPIPE`（2026-11-09 重踩，连试三次沙箱内外都一样）。一律 `env -u NODE_OPTIONS npm run build` / `env -u NODE_OPTIONS npx next dev`；用户自己终端里不受影响。
5. **dev 与 prod 不能同时跑**：`next dev` 和 `next build`/`start` 抢同一个 `.next` 目录，会写坏（症状：`Cannot find module './xxx.js'`）。起 prod 前先停 dev；坏了就 `rm -rf .next` 重建（2026-10-20 踩过）。
6. ~~配色两套~~ 已统一（2026-10-19，token 见 UI 约定章）。
7. **rsync 排除模式不锚定会误伤同名目录**（2026-10-20 踩过）：`--exclude 'data'`（无前导斜杠）按"任意层级匹配名为 data 的项"处理，`app/api/data/` 被连带排除，该目录 7月13日后从未同步，部署时远程 build 直接红。根目录排除一律写 `/data`。诊断法：远程文件 mtime 异常旧 = 它没被 rsync 碰过。
8. **服务器拉不动 binaries.prisma.sh**（2026-10-30 踩过）：`npx prisma generate` 在 docker build 里下载引擎二进制超时挂掉。之前能过全靠 docker 层缓存，schema 一变缓存失效就暴露。已根治：Dockerfile 里 `ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma`。构建红在 prisma generate 一步先想这条。
9. **`next start` 不热更新**（2026-11-09 栽过）：本地起生产模式看效果时，改完源码必须重新 `build` + 重启进程，否则浏览器看到的一直是旧构建（症状：源码明明改了、页面毫无变化、服务端返回的 CSS/类名是旧的）。排查顺序：先确认端口跑的是 `dev` 还是 `start`，再 grep `.next` 产物里有没有新类名。想边改边看就用 `dev`。

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
docs/           PLAN.md（优化计划，阶段 0-4 已完成） DESIGN-NOTES.md（设计评审/视觉方案）
                screenshots/（README 配图）
```
