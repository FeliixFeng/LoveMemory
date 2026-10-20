# LoveMemory 优化计划（2026-10-19）

> 状态：**阶段 0、1 已完成（2026-10-19），样式/字体（B 节）已完成（含 B2/B3 字体自托管，2026-10-20），阶段 2-4 待做**。
>
> 阶段 1 额外完成：账单表单打开自动滚入视区、新增账单后自动滚到最新一条、保存成功后才关闭表单。
>
> 样式/字体收口要点：颜色 token 11 个（`--lm-bg/line/ink/ink-strong/body/muted/accent/accent-deep/blush`），强调色定折中 `#CC9266`（旧赤陶 ↔ 新暖金中点），字体 token 2 个；260 处硬编码 hex → 0；26 处内联 `fontFamily` → `var(--lm-font-*)`；`app/lib/theme.ts` 承载 canvas/echarts 颜色（与 `:root` 同步维护）。

---

## 一、已确认的问题清单

### A. 滚动（用户主诉）

| # | 问题 | 位置 | 后果 |
|---|---|---|---|
| A1 | **滚轮接管时间轴（设计意图，保留）**：hero 上挂 `wheel`，垂直滚动 → 时间线横向滚动。意图正确，但边界处理有缺陷（见下方 A1 详解） | `love-memory-client.tsx:56-80` | 时间线滚到头之后**页面彻底卡死**，没有退路 |
| A2 | 5 个浮层全部没有锁 body 滚动 | EventDetail / EventModal / PinModal / ConfirmDialog / Lightbox | 弹窗开着，背后页面跟着滚；滚到底"穿透" |
| A3 | `overscroll-behavior` 全项目 0 处 | 全局 | 内部滚动到底带动整页 |
| A4 | `viewport-fit=cover` 已开，但 `env(safe-area-inset-*)` 0 处 | `BottomTabBar` / `PageWrapper` / `FloatingAddButton` | iPhone 底部 tab 被 home indicator 压住；页面末尾被遮挡（需要 90px，只给了 80px） |
| A5 | `modal-backdrop` / `modal-content` 两个 class **从未定义** | `EventDetail.tsx:42,44` | 没有入场动画、没有滚动隔离，写了等于没写 |
| A6 | 层级错乱：详情 `z-40` < 导航 `z-50` | `EventDetail` vs `NavBar`/`BottomTabBar` | 遮罩盖不住导航栏，导航浮在弹窗上面 |
| A7 | `scrollIntoView` 选中项自动居中 | `HorizontalTimeline.tsx:30-32` | 首屏加载时可能带动整页跳一下 |
| A8 | 性能型卡顿：每张 `.lm-card` 都有 `backdrop-filter: blur(20px)`；12 个 emoji 持续动画 + `will-change` | `globals.css` / `FallingHearts` | 移动端滚动掉帧、不跟手 |

### A1 详解：保留"上下滚 → 左右滚"，修 3 个缺陷

**前提（已与用户确认）**：封面图和时间轴是**一体的**（时间轴压在封面上），整块 hero 响应滚轮是**设计意图，保留**，不收窄作用域。

| 编号 | 缺陷 | 具体表现 |
|---|---|---|
| A1-1 | **边界不释放（硬伤）** | 时间线滚到最左/最右后，`scrollLeft` 不再变化，但 `preventDefault()` 照旧执行 → 页面**完全滚不动**，用户会以为卡死 |
| A1-2 | 没有修饰键保护 | `Ctrl + 滚轮`（触控板缩放）同样被拦，缩放失效 |
| A1-3 | 延迟绑定 500ms | 首屏加载后 0.5 秒内滚动行为不一致（先正常滚动，然后突然变成横向） |
| A1-4 | 页面已下滚时仍接管 | 用户滚到下方看正文，想往上滚回封面，鼠标经过 hero 区域时滚轮被拿去滚时间轴，页面不动 |

改进方案（交互不变，只补边界）：

1. **边界释放**：已到最左/最右且继续同方向滚动时，不调用 `preventDefault()`，把控制权还给页面
2. **只在页面顶部接管**：`window.scrollY > 8` 时完全放行。页面在顶部 → hero 就是横向轮播；一旦开始下滚看正文 → 恢复普通滚动。回到顶部后自动恢复接管
3. `Ctrl / ⌘` 按下时直接放行
4. 去掉 500ms 延迟，改 `useLayoutEffect`，ref 就绪即绑定
5. 触控板横向手势（`|deltaX| > |deltaY|`）保持原生，不干预
6. 作用域**保持整个 hero**（封面 + 时间轴一体），不做收窄

### B. 样式与字体（**2026-10-19 完成**）

> 已统一为 token 系统：`app/globals.css` 单一来源 + Tailwind v4 `@theme inline` 自动生成工具类。
> 强调色决策：折中 `#CC9266`（旧赤陶 `#D48B60` 与新暖金 `#C49A6C` 中点），新旧页面差异最小。
> 画布/echarts 不认 CSS 变量，颜色常量在 `app/lib/theme.ts`，与 `:root` 同步维护。

| # | 原问题 | 现状 |
|---|---|---|
| B1 | 配色只改一半 | ✅ 260 处硬编码 hex → 0（仅 `globals.css` 自身 + `theme.ts` 保留字面量）|
| B2 | Google Fonts 阻塞 + 国内加载失败 | ✅ 2026-10-20：Playfair Display 改 `next/font/local` 自托管（latin 子集，app/fonts/），Noto Serif SC 移除改系统兜底（Songti SC/STSong），HTML 零外部字体请求 |
| B3 | `Inter` 声明但未加载 | ✅ 随 B2 一并处理：body 保留系统栈兜底，不再声明 Inter |
| B4 | 非法类名 `bg-[#C49A6C]/20/40` | ✅ |
| B5 | 26 处内联 `fontFamily` | ✅ 全部改为 `var(--lm-font-*)` 引用 |
| B6 | `manifest.json` / `themeColor` 旧色 | ✅ `themeColor` 已用 `THEME.accent`；manifest 待下次清理 |

### C. 数据安全（你交给我优化）

| # | 问题 |
|---|---|
| C1 | `/api/data` POST 无 zod 校验，裸收整份 payload |
| C2 | 写入语义是"整份覆盖"：`deleteMany({ notIn })` + 逐条 upsert。旧客户端/并发保存会删掉新数据；`events: []` 会级联删光消费记录 |
| C3 | PIN 6 位无失败限制；token 的 HMAC 密钥就是 PIN 本身 |

### D. 性能与工程（5/6 + 9-12）

| # | 问题 |
|---|---|
| D1 | 首页 / 相册 / 设置 / 足迹 4 处各自 `fetch('/api/data')` 全量拉取，无共享缓存 |
| D2 | `writeAppData` 事务里 N 条 SQL 循环（照片还多一次 `findFirst`） |
| D3 | 三套写路径并存（全量 `/api/data` + 资源化 `/api/events`、`/api/wishes`） |
| D4 | 无 typecheck / lint，部署前无门禁 |
| D5 | 测试只有 188 行接口测试，最危险的写入逻辑没测 |
| D6 | 3 处 `as unknown as` 绕过 Prisma 类型 |

---

## 二、执行计划

### 阶段 0：小修补（5 分钟）
1. 修 `NavBar.tsx:25` 的非法类名 `bg-[#C49A6C]/20/40` → `bg-[#C49A6C]/40`
2. 其余样式/字体项**不做**（见 B 节说明）

### 阶段 1：滚动与浮层
1. **保留滚轮接管整块 hero（封面 + 时间轴一体），修 3 个缺陷**（A1 详解）：
   - 边界释放（滚到头就还给页面）
   - 时间轴不在视口内时放行
   - `Ctrl/⌘` 放行
   - 去掉 500ms 延迟
2. 新建 `hooks/useScrollLock.ts`：浮层打开时锁 body（含 iOS 位置保持），关闭恢复
3. 新建 `components/ui/Overlay.tsx`：统一遮罩、Esc 关闭、点遮罩关闭、焦点陷阱、层级常量
   - 层级规范：导航 40 / 底部抽屉 50 / 居中弹窗 60 / 灯箱 70 / Toast 80
4. 安全区：tab bar 加 `pb-[env(safe-area-inset-bottom)]`；`PageWrapper` 底部留白改 `calc(5rem + env(...))`；FAB 改 `bottom-[calc(64px + env(...))]`
5. `overscroll-behavior: contain` 加到所有内部滚动容器
6. 时间线居中改手动 `scrollTo`，避免 `scrollIntoView` 带动整页
7. 性能：`.lm-card` 的 blur 从 20px 降到 8px（或去掉，只保留浮层用）；`FallingHearts` 粒子 12→6，只在首页挂载
8. 验收：时间线滚到两端后页面能继续滚；弹窗开着背景不动；iPhone 底部不被遮挡

### 阶段 2：数据安全（C1/C2/C3 + D3/D5/D6）
1. `/api/data` POST **只接受 settings 字段**（zod `SettingsPatchSchema`），传 events/photos 等返回 400
2. `app-data.ts` 拆出 `writeSettings()`，彻底删除 `writeAppData` 的 `deleteMany({ notIn })` 路径
3. 前端 `SettingsPage` 改走 settings 接口，不再 POST 整份 `AppData`
4. PIN：失败计数（5 次 / 5 分钟锁定）+ token 密钥独立为 `APP_SECRET`（缺省回退 PIN 并打警告）
5. 测试：`writeSettings` 单测 + 级联删除回归 + 并发保存
6. 去掉 3 处 `as unknown as`，改 Prisma 生成类型 + 显式 `select`
7. 验收：`npm test` 全绿；构造 `{events:[]}` 请求返回 400 而非删库

### 阶段 3：性能（D1/D2/D4）
1. 数据 Provider：`useAppData` 提升到 `SiteLayoutClient`，四个页面共享一份 + 变更后失效重取（不引第三方依赖）
2. `writeSettings` 用 `$transaction([...])` 批量提交；照片改用 `url` 唯一键直接 `upsert`，去掉 `findFirst`
3. 加 `npm run typecheck`（`tsc --noEmit`），作为部署第 1 步（已写入 AGENTS.md 部署章节；deploy.sh 已删除）
4. 验收：切 tab 只发 1 次 `/api/data`；typecheck 通过

### 阶段 4：移动端底部抽屉
1. 新建 `components/ui/Sheet.tsx`
   - 移动端：`fixed inset-x-0 bottom-0`、`max-h-[85dvh]`、圆角顶、拖拽手柄、下滑关闭（阈值 + 速度）、滚动锁定、safe-area 底部留白
   - `sm` 及以上：回退为居中弹窗（复用 Overlay）
2. `EventDetail` 接入 Sheet；`EventModal` / `PinModal` / `ConfirmDialog` 统一接入
3. `Lightbox` 保持全屏（不套 Sheet）
4. 验收：拖拽跟手、下滑关闭、内容滚动不影响背景、桌面端仍是居中弹窗

---

## 三、总验收清单

- [ ] 时间线滚到最左/最右后，页面能继续正常滚动
- [ ] 在封面图上滚轮也能驱动时间轴（一体交互，保留）
- [ ] 页面下滚后（`scrollY > 8`），滚轮不再被接管，能正常上下滚；回到顶部后恢复接管
- [ ] `Ctrl + 滚轮` 缩放不被拦截
- [ ] 任一浮层打开，背景页面不滚动
- [ ] iPhone 上底部 tab 不被 home indicator 压住，页面末尾内容完整可见
- [ ] 移动端事件详情是底部抽屉，可拖拽、可下滑关闭
- [ ] 桌面端事件详情仍是居中弹窗
- [ ] `npm run typecheck && npm test && npm run build` 全通过
- [ ] `/api/data` POST 传 `events` 返回 400

## 四、风险与取舍

1. **滚轮接管保留后仍有学习成本**：用户需要先横向滚完时间线才能继续下滚。这是该交互的固有特性，边界释放能避免"卡死"，但无法完全消除"想下滚却在横滚"的意外感。
2. ~~样式/字体问题仍在（两套配色混用、Google Fonts 可能加载失败）~~ 已解决：配色统一见 B1，字体自托管见 B2/B3（2026-10-20）。
3. **阶段 2 会让 `/api/data` POST 变成不兼容接口**——目前只有本项目前端在用，无外部调用方，风险可控。
4. 每阶段结束都本地验证再继续，不一次性全改完。
