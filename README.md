# 💕 LoveMemory - 珍藏回忆

> 一个高颜值、充满温度的情侣纪念网站。
> A warm, emotionally engaging memory space for couples.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16-green.svg)

## ✨ 特性 (Features)

*   **🎨 情感化 UI 设计**: 采用暖色调 Mesh Gradient 背景与磨砂玻璃 (Glassmorphism) 效果，营造温馨氛围。
*   **📱 移动端优先**: 完美适配手机屏幕，拥有原生 App 般的流畅交互与触控反馈。
*   **🎞️ 沉浸式体验**:
    *   **呼吸感封面**: 首页大图支持“呼吸”微动效，让回忆鲜活起来。
    *   **横向时间轴**: 记录恋爱的关键里程碑 (First Date, First Trip...)。
    *   **瀑布流相册**: 智能排列的甜蜜瞬间。
*   **🔒 数据隐私**: 图片存储在本地，不上传第三方云端，确保留念安全。
*   **🌏 中英双语设计**: 核心功能全中文，装饰元素英文点缀，时尚与实用并存。

## 🛠️ 技术栈 (Tech Stack)

*   **Frontend**:
    *   [Tailwind CSS](https://tailwindcss.com/) - 实用主义 CSS 框架
    *   [Alpine.js](https://alpinejs.dev/) - 轻量级响应式框架
    *   Phosphor Icons - 高级线性图标库
*   **Backend**:
    *   Node.js + Express - 轻量级后端服务
    *   Multer - 文件上传处理

## 🚀 快速开始 (Quick Start)

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
# 开发模式 (支持热重载)
npm run dev

# 生产模式
npm start
```

服务启动后，访问浏览器：`http://localhost:3000`

### 3. 使用指南

1.  **设置纪念日**: 点击右上角头像或通过底部设置面板，选择你们的纪念日。
2.  **上传封面**: 点击首页巨大的 Hero 卡片，即可更换封面背景图。
3.  **上传照片**: 点击 "+" 按钮或相册区域的上传卡片，添加新的美好瞬间。

## 📂 目录结构

```
LoveMemory/
├── public/
│   ├── css/          # 样式文件
│   ├── js/           # 前端逻辑 (Alpine.js)
│   ├── uploads/      # 图片存储目录 (Git ignored)
│   └── index.html    # 核心页面
├── src/
│   ├── controllers/  # 控制器逻辑
│   ├── routes/       # 路由配置
│   └── app.js        # 后端入口
├── data/             # 数据存储 (JSON/DB)
└── package.json
```

## 🤝 贡献 (Contributing)

欢迎提交 PR 或 Issue 来改进这个小项目！让爱更美好。

## 📄 许可证 (License)

MIT License
