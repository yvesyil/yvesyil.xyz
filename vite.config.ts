import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    { enforce: 'pre', ...mdx({ jsxImportSource: 'react', providerImportSource: undefined }) },
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
