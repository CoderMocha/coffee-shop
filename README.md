# Mocha Coffee

一个以咖啡影像为主角的滚动叙事品牌站点。页面通过 GSAP 将滚动进度映射到咖啡视频帧，让容器、咖啡粉、水流与成品咖啡在一次连续滚动中完成视觉转场。

在线预览：[morrow-coffee-film.vercel.app](https://morrow-coffee-film.vercel.app)

## 项目特点

- **滚动控制影像**：使用 GSAP ScrollTrigger 驱动画布中的 240 帧画面，滚动速度与影像进度保持同步。
- **一镜到底体验**：Hero、章节文案和结尾信息共享同一条时间线，避免板块切换打断叙事。
- **视差氛围层**：叠加蒸汽、玻璃焦散和咖啡颗粒，为主体影像增加空间感。
- **品牌化界面**：包含 Mocha Coffee 字标、橙色咖啡罐图形、定制 favicon 与英文品牌文案。
- **响应式设计**：针对桌面端与移动端分别调整画面焦点、滚动距离和动画节奏。
- **帧资源预加载**：采用精灵图分片、相邻资源预取和缓存控制，降低快速滚动时的卡顿。

## 技术栈

- Next.js App Router
- React + TypeScript
- GSAP + ScrollTrigger
- Canvas 2D
- Tailwind CSS
- Vinext + Vite
- Vercel

## 本地运行

环境要求：Node.js `>= 22.13.0`

```bash
npm install
npm run dev
```

开发服务器默认运行在：

```text
http://localhost:5173
```

## 构建与预览

```bash
npm run build
npm run start
```

常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 预览已构建版本 |
| `npm run lint` | 检查代码规范 |
| `npm run install:ci` | 按锁文件安装 CI 依赖 |

## 目录说明

```text
app/
├── globals.css          # 全局样式与响应式布局
├── layout.tsx           # 页面元数据与字体配置
├── page.tsx             # 首页入口
└── scroll-story.tsx     # GSAP 时间线、Canvas 绘制与滚动交互

public/
├── brand/               # 品牌标识
├── film-sheets/         # 滚动播放使用的精灵图序列
├── parallax/            # 蒸汽、焦散与颗粒视差素材
├── coffee-film.mp4      # 原始咖啡影像
└── favicon.*            # 站点图标
```

## 影像播放方式

页面没有在滚动时反复修改 `<video>` 的播放位置，而是把原始视频拆分为 8 张精灵图，共 240 帧。滚动过程中，Canvas 根据当前进度绘制对应帧，并提前缓存相邻分片。这种方式能减少频繁 seek 带来的停顿，让滚动影像保持稳定。

## 部署

项目已配置 `vercel.json`，可直接连接 Vercel 仓库部署。生产构建命令为：

```bash
npm run build
```

部署时无需提交 `.env`、`.vercel`、`node_modules`、构建缓存或 `artifacts` 目录。
