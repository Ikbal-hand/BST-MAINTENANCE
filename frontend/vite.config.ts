import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const appDomain = env.VITE_APP_DOMAIN || 'bst-maintenance.local'
  const branchDomain = env.VITE_BRANCH_DOMAIN || 'bst-maintenance.local'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: false,
        },
      },
      allowedHosts: [
        appDomain,
        `.${branchDomain}`,
        'central.bst-maintenance.test',
        'bandung.bst-maintenance.test',
        'central.bst-maintenance.local',
        'bandung.bst-maintenance.local',
      ],
    },
  }
})
