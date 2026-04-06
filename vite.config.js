import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 压缩 > 10KB 的资源
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // 压缩 > 10KB 的资源
    }),
  ],
  css: {
    lightningcss: false  // 禁用LightningCSS，使用原生CSS处理避免变量值被错误裁剪
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/element-plus')) {
            return 'element-plus'
          }
          if (id.includes('node_modules/vue') || id.includes('node_modules/axios') || id.includes('node_modules/sockjs') || id.includes('node_modules/stompjs')) {
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: 'esbuild',
  },
})
