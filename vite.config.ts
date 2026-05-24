import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前开发/生产模式下的环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  // 大模型调用的最终真实代理服务器地址 (优先读取环境变量，否则默认采用 Token Plan 旗舰网关)
  const targetUrl = env.VITE_MIMO_TARGET_URL || 'https://token-plan-cn.xiaomimimo.com';

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['.ngrok-free.dev'],
      proxy: {
        // 双路由兼容代理 1: 完美适配 /api/mimo 前缀
        '/api/mimo': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mimo/, ''),
          secure: false
        },
        // 双路由兼容代理 2: 完美适配 /api-mimo 前缀
        '/api-mimo': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-mimo/, ''),
          secure: false
        }
      }
    }
  };
})

