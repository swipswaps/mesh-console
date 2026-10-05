import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use repository name as base for GitHub Pages; '/' for local dev.
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/mesh-console/' : '/'
  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
    },
  }
})
