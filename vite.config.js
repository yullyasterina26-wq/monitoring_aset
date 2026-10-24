import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = (env.API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allow LAN and private VPN clients to connect
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
