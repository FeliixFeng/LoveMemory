# 技术与体验细节维护记录（已修复与待办）

> 本文记录代码走查中发现的性能、缓存与代码细节问题及其修复状态。

---

### ✅ 1. PWA Service Worker 生产环境被误清理（已修复）
* **位置**：`app/layout.tsx`
* **状态**：**已修复（2026-11-24）**
* **修复内容**：增加服务端 `isDev = process.env.NODE_ENV === 'development'` 判断，仅在开发环境执行缓存清空与 unregister，生产环境无干扰注册 Service Worker，保障离线与静态缓存。

### ✅ 2. 设置页「我们的名字」按键即触发鉴权与网络请求（已修复）
* **位置**：`components/SettingsPage.tsx`
* **状态**：**已修复（2026-11-24）**
* **修复内容**：引入 `namesDraft` 本地 state 进行输入受控，在 `onBlur` 或回车时才比对差异并触发 `withAuth` 保存，输入打字彻底告别网络请求与 PIN 弹窗重放。

### ✅ 3. 大图灯箱（Lightbox）切图缺少预加载（已修复）
* **位置**：`components/Lightbox.tsx`
* **状态**：**已修复（2026-11-24）**
* **修复内容**：查看当前大图时，后台静默实例化 `Image` 预载上一张与下一张的资源，消除手机端滑动切图的等待白屏。

### ✅ 4. 心愿与胶囊页历史遗留重渐变统一（已修复）
* **位置**：`components/WishesCapsulesPage.tsx`
* **状态**：**已修复（2026-11-24）**
* **修复内容**：将遗留的橙色实心渐变替换为全站统一的 `.lm-glass-pill`（磨砂玻璃高光）与 `.lm-glass-chip` 交互小片。

### ✅ 5. 2核2G部署机 `next build` 内存打满导致 Swap/IOPS 锁死（已加固）
* **位置**：`Dockerfile`、`next.config.mjs`
* **状态**：**已加固（2026-11-25）**
* **修复内容**：`next.config.mjs` 配置 `cpus: 1`、`webpackMemoryOptimizations: true`、`webpackBuildWorker: true`，`Dockerfile` 构建阶段设置 `NODE_OPTIONS="--max-old-space-size=640"`，构建前临时暂停 `freellmapi`、完成后自动拉起，实测构建稳定在 ~2 分钟、Swap 0 占用。

### ✅ 6. 缩略图未彻底分流且 OSS 图片经 `/_next/image` 二次中转（已修复）
* **位置**：`lib/image.ts`、`components/SafeImage.tsx`、`components/Lightbox.tsx`、`components/AlbumPage.tsx`、`components/MapPage.tsx`、`components/MemoryFlashback.tsx`、`components/SettingsPage.tsx`
* **状态**：**已修复（2026-11-25）**
* **修复内容**：`SafeImage` 对外部 OSS URL 与 `/uploads/thumbs/` 自动开启 `unoptimized` 直连加载并接通 `fallbackSrc` 兜底；全站小尺寸封面与网格统一使用 `480px` 缩略图，仅首页 `HeroSection` 与 `Lightbox` 加载原图（且 `Lightbox` 先缩略图垫底秒开）。

### ✅ 7. 桌面端相册卡片沿用移动端单列大图导致视觉突兀（已修复）
* **位置**：`components/AlbumPage.tsx`
* **状态**：**已修复（2026-11-25）**
* **修复内容**：平板端切 2 列、桌面端切 3 列（`aspect-[4/3]`）画廊橱窗，并将「拾光碎片」对齐并入网格；点击「翻开」改为弹出 `<Overlay layer="sheet">` 内页抽屉，避免撑乱多列网格。

---

### ⏳ 8. `readAppData` 全量 SSR 载荷膨胀（待后续数据规模扩大时优化）
* **位置**：`app/(site)/layout.tsx` & `app/lib/app-data.ts`
* **现象**：全站所有路由每次 SSR 都会拉取全量数据库内容（全部事件、照片、账单、胶囊、心愿）。
* **建议**：未来随着照片和事件增多，相册和独立页面可考虑分页或按需轻量化下发。
