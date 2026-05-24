import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      // Bundle every route into the initial chunk so route changes don't
      // wait on an HTTP fetch — navigation becomes fully client-side once
      // the app has loaded.
      autoCodeSplitting: false,
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
