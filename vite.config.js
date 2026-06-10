import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    base: '/',
    build: {
      outDir: 'dist',
    },
    server: {
      proxy: env.VITE_BACKEND_URL
        ? undefined
        : {
            '/api': {
              target: backendTarget,
              changeOrigin: true,
            },
            '/auth': {
              target: backendTarget,
              changeOrigin: true,
            },
          },
    },
  }
})
