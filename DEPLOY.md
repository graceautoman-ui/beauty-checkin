# GitHub Pages 部署说明

## 一、仓库名要和 base 一致

当前配置的访问路径是：`https://<你的用户名>.github.io/beauty-checkin/`

- 若 GitHub 仓库名就是 **beauty-checkin**，无需改配置。
- 若仓库名是别的（例如 **my-beauty-log**），请改 `vite.config.ts` 里的 `base`：
  ```ts
  base: '/my-beauty-log/',   // 改成你的仓库名
  ```

## 二、首次部署步骤

1. **在 GitHub 新建仓库**（若还没有）
   - 仓库名建议用 `beauty-checkin`（或与上面 base 一致）。
   - 不要勾选 “Add a README”（避免和本地不同步）。

2. **本地初始化并推送**
   ```bash
   cd "/Users/grace/Documents/Beauty Log/beauty-checkin"
   git init
   git add .
   git commit -m "Beauty checkin app"
   git remote add origin https://github.com/<你的用户名>/beauty-checkin.git
   git branch -M main
   git push -u origin main
   ```

3. **安装依赖并执行部署**
   ```bash
   npm install
   npm run deploy
   ```
   首次会提示输入 GitHub 用户名和密码（或 Personal Access Token）。

4. **在 GitHub 开启 Pages**
   - 打开仓库 → **Settings** → **Pages**
   - **Source** 选 **Deploy from a branch**
   - **Branch** 选 **gh-pages**，目录选 **/ (root)**，保存。

5. **等 1～2 分钟**，在浏览器打开：
   `https://<你的用户名>.github.io/beauty-checkin/`
   手机也可以直接打开这个链接，或“添加到主屏幕”当小应用用。

## 三、之后更新

改完代码后部署到 GitHub Pages：

```bash
npm run deploy
```

会自动执行 `npm run build` 并把 `dist` 推到 `gh-pages` 分支，页面会更新。
