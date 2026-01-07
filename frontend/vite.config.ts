import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将 node_modules 中的大型依赖拆分为独立 chunk
          if (id.includes('node_modules')) {
            // 框架核心：React + Ant Design（合并避免循环依赖）
            if (id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('antd') ||
                id.includes('@ant-design') ||
                id.includes('rc-')) {
              return 'framework';
            }
            // 代码高亮
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-highlighter';
            }
            // Lucide 图标
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            // Toast 通知库
            if (id.includes('sonner')) {
              return 'sonner';
            }
            // 其他第三方库
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
