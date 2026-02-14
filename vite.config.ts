import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署在 https://<用户名>.github.io/<仓库名>/ ，base 需与仓库名一致
  base: '/beauty-checkin/',
})
