<p align="center">
  <img src="web/public/logo.svg" width="96" alt="infinite-canvas logo">
</p>

<h1 align="center">无限画布 (infinite-canvas)</h1>

<p align="center">
  <a href="https://linux.do/"><img src="https://img.shields.io/badge/Linux.do-Community-2b6de8?style=flat-square" alt="Linux.do"></a>
  <a href="VERSION"><img src="https://img.shields.io/badge/version-0.1.6-2563eb?style=flat-square" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f97316?style=flat-square" alt="License"></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://reactrouter.com/"><img src="https://img.shields.io/badge/React_Router-7-ca4245?style=flat-square&logo=reactrouter&logoColor=white" alt="React Router"></a>
</p>

一个纯浏览器运行的 AI 创作画布。打开网页、填入自己的 OpenAI 兼容 `Base URL` 和 `API Key`，就能在无限画布上写提示词、生图、改图、生成视频，所有数据都留在你自己的浏览器里。

本项目基于 [basketikun/infinite-canvas](https://github.com/basketikun/infinite-canvas) 精简而来：去掉了账号体系、服务端后台和平台化功能，只保留本地自用需要的部分，不需要数据库，也不需要后端服务。

> [!CAUTION]
> 项目目前处于开发阶段，不保证历史数据兼容。各种数据库结构和存储格式都可能直接调整，欢迎关注后续更新，当前更适合个人/本地部署，不建议直接公网多人共用。
>
> 如果你需要稳定维护自己的分支，建议自行 fork 后独立开发。二次开发与 PR 请保留原作者信息和前端页面标识。

## 核心功能

- 无限画布：多画布项目，节点拖拽缩放、连线、框选、小地图、撤销重做、快捷键、导入导出 JSON。
- 三类节点：图片节点、文本节点、生成配置节点；生成配置节点可读取上游内容，批量出图或出文。
- AI 生成：浏览器直连你配置的 OpenAI 兼容接口，支持文生图、图生图、参考图编辑、文本问答和视频生成（含火山方舟 Seedance 2.0）。
- 图片处理：裁剪、多角度变换、替换、下载、生成失败重试，结果都能落回画布。
- 生成图库：汇总生图工作台记录和所有画布里的 AI 生成图片，可按来源筛选、搜索、连续预览，一键收藏到画廊。
- 我的素材 / 画廊：本地管理图片、视频和文本素材，随时插回画布或工作台。
- 提示词库：内置多个在线提示词源，可搜索、收藏、直接用到画布。
- WebDAV 同步：浏览器直连你自己的 WebDAV，用来跨设备备份画布和素材。

如果你在为担心没有合适的生图API来发愁，可以查看该免费生图项目：[chatgpt2api](https://github.com/basketikun/chatgpt2api)

## 快速开始

需要 [Bun](https://bun.sh/)。

```bash
git clone https://github.com/yusheng-99/infinite-canvas-clean.git
cd infinite-canvas-clean/web
bun install
bun run dev
```

Docker 运行：

```bash
docker build -t infinite-canvas .
docker run --rm -p 3000:3000 infinite-canvas
```

两种方式默认端口都是 3000，打开 `http://localhost:3000` 即可。

首次打开后点右上角配置，填入自己的 OpenAI 兼容 `Base URL` 和 `API Key`，就可以开始生成了。

也支持 Vercel 一键导入：根目录 `vercel.json` 会直接构建 `web/`，纯静态部署，不需要服务端环境变量。

## 数据与安全

- 画布项目、素材、生成记录、画廊和 AI API Key 全部保存在浏览器本地（localforage / IndexedDB），没有云账号，也没有服务端数据库。
- AI 请求由浏览器直接发给你配置的接口，API Key 不经过本项目任何服务端，所以请只在自己的设备和可信浏览器里使用，不要部署成公网多人共用站点。
- 换浏览器、清缓存或换设备都会丢数据，重要内容请用画布导出 JSON 或 WebDAV 同步做备份。
- WebDAV 也是浏览器直连；如果远端服务不支持 CORS，需要自己加反向代理。

## 技术栈

- 前端：Vite 7、React 19、React Router 7、TypeScript、Tailwind CSS 4、Ant Design 6、Zustand、TanStack Query。
- 本地存储：localforage（IndexedDB）。
- 部署：Vercel 静态部署，或 Docker + nginx 静态托管。

## 与原项目的主要不同

- 定位：个人本地自用精简版，不保留平台化入口。
- 架构：从 Next.js 迁移到 Vite + React Router，运行时不再需要 Node 服务。
- 部署：Docker 运行层改为 nginx 静态托管，默认端口仍是 `3000`。
- 已移除：账号登录、后台管理、本地 Agent / MCP、Codex App 插件、画布右侧助手工具区、应用内文档入口。
- 首页：改为简洁入口浮窗，只保留画布、生图、视频、素材、生成图库、画廊和提示词入口。

## New API 自动配置

如果使用 New API，可参考上游在线体验 [canvas.best](https://canvas.best/) 的自动配置格式，在 `系统设置 -> 聊天方式 -> 添加聊天设置` 中填入：

```text
https://canvas.best?apiKey={key}&baseUrl={address}
```

跳转后会自动打开配置弹窗并填入 API Key 和 Base URL。
如果自己部署了，可以把 `https://canvas.best` 替换成你部署的地址。

## 效果展示

<table width="100%">
  <tr>
    <td width="50%"><img src="https://i.ibb.co/TDFvGWDT/image.png" alt="image" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/zVwJq3YS/image.png" alt="image" border="0"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://i.ibb.co/PvY3qhhK/image.png" alt="image" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/7D04LwN/image.png" alt="image" border="0"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://i.ibb.co/bj30FtS5/5.png" alt="5" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/hxRvjw51/image.png" alt="image" border="0"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://i.ibb.co/jkWsF8q1/image.png" alt="image" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/XrnfXHx7/image.png" alt="image" border="0"></td>
  </tr>
</table>

## 上游项目

- 原项目：[basketikun/infinite-canvas](https://github.com/basketikun/infinite-canvas)
- 本仓库是个人精简分支，保留原作者信息和 AGPL-3.0 协议。

## 开源协议

本项目使用 GNU Affero General Public License v3.0，见 [LICENSE](LICENSE)。

## Star History

<a href="https://www.star-history.com/?repos=yusheng-99%2Finfinite-canvas-clean&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=yusheng-99/infinite-canvas-clean&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=yusheng-99/infinite-canvas-clean&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=yusheng-99/infinite-canvas-clean&type=date&legend=top-left" />
 </picture>
</a>
