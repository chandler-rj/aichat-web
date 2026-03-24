import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  css: {
    lightningcss: false  // 禁用LightningCSS，使用原生CSS处理避免变量值被错误裁剪
  }
})
