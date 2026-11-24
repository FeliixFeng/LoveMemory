# 待跟进的技术与体验细节清单（非视觉）

> 本文记录代码走查中发现的性能、缓存与代码细节问题，作为后续维护参考，当前不阻塞视觉与样式改造。

---

### 1. PWA Service Worker 生产环境被误清理
* **位置**：`app/layout.tsx` (L44-L60)
* **现象**：用于清除开发缓存的 `unregister()` 和 `caches.delete()` 在生产环境也被无条件注入并先于注册执行，导致 PWA 离线缓存每次进入页面都被清空。
* **建议**：改为仅在 `process.env.NODE_ENV === 'development'` 时执行清理逻辑。

### 2. 设置页「我们的名字」按键即触发鉴权与网络请求
* **位置**：`components/SettingsPage.tsx` (L85-L95)
* **现象**：`coupleNames` 输入框直接在 `onChange` 触发 `withAuth(() => void save(...))`，每次打字都会发起网络请求并可能重复触发 PIN 弹窗。
* **建议**：使用受控本地 state，在 `onBlur` 或防抖（Debounce 500ms）后再持久化。

### 3. 大图灯箱（Lightbox）切图缺少预加载
* **位置**：`components/Lightbox.tsx` (L87-L99)
* **现象**：查图时用原生 `<img>`，切换上一张/下一张完全依赖网络即时拉取，切图有明显的 loading 停顿感。
* **建议**：在查看第 `i` 张时，静默预载 `i - 1` 和 `i + 1` 的图片资源。

### 4. `readAppData` 全量 SSR 载荷膨胀
* **位置**：`app/(site)/layout.tsx` & `app/lib/app-data.ts`
* **现象**：全站所有路由每次 SSR 都会拉取全量数据库内容（全部事件、照片、账单、胶囊、心愿）。
* **建议**：未来随着照片和事件增多，相册和独立页面可考虑分页或按需轻量化下发。
