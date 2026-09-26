# 野趣探索 · TrailQuest Web

纯静态探索游戏：圈区、布置宝藏/陷阱/补给点，使用前台 GPS 或明确标记的演示模式探索，记录足迹和事件。无需登录，数据仅保存在当前浏览器，可导出 JSON。

## GitHub Pages

在线地址：https://azfiles.github.io/TrailQuest-web/

免费 HTTPS 由 GitHub Pages 提供。仓库 Settings → Pages → Source 选择 GitHub Actions。发布工作流为 `.github/workflows/pages.yml`，首次配置后仅手动运行。

浏览器需允许精确定位。锁屏或切后台自动暂停；网页不保证后台 GPS。底图使用 OpenStreetMap，需要联网。切换设备/浏览器或清除网站数据会丢失本机记录；旧 HTTP 站点的数据不会自动迁移。

## 开发

```bash
npm ci
npm test
npm run build
npm start
```

打开 http://localhost:8787/TrailQuest-web/ 。`dist/` 是部署产物，服务器无需 Node.js 或数据库。Vite base、图标、manifest 和 Service Worker 均支持项目子路径，缓存限定在本站目录。

## 验证

18 项游戏规则测试；桌面 Chromium 和移动端 WebKit 验证完整演示探索、足迹历史、刷新保留与无后端请求。前台定位流程测试使用确定性的模拟 Geolocation 回调，不等同于真机权限弹窗或户外 GPS 实测。Playwright 1.55 的原生定位覆盖在本次 CI 中存在瞬时错误/时间戳差异，因此不以它作为连续定位流的依据。
