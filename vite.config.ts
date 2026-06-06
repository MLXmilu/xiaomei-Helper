import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

// 动态获取电脑真实的局域网 IPv4 地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// 迷你的内存 API 服务（利用 Vite Dev Server 直接作为后端！）
function collabBackendPlugin(): Plugin {
  const sessions: Record<string, any[]> = {};
  return {
    name: 'collab-backend',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/feedback/')) {
          const sessionId = req.url.split('/').pop()?.split('?')[0];
          if (!sessionId) return next();
          
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                if (!sessions[sessionId]) sessions[sessionId] = [];
                sessions[sessionId].push(JSON.parse(body));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
          
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(sessions[sessionId] || []));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前开发/生产模式下的环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  // 大模型调用的最终真实代理服务器地址 (优先读取环境变量，否则默认采用 Token Plan 旗舰网关)
  const targetUrl = env.VITE_MIMO_TARGET_URL || 'https://token-plan-cn.xiaomimimo.com';

  return {
    plugins: [react(), collabBackendPlugin()],
    define: {
      '__LOCAL_IP__': JSON.stringify(localIP)
    },
    server: {
      host: '0.0.0.0', // 必须开启，允许局域网同 WiFi 下的手机访问
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

