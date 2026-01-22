import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'https://elves-core1.alvey.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1600,
    manifest: true,
    assetsInlineLimit: 4096,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    commonjsOptions: {
      include: /node_modules/,
      transformMixedEsModules: true
    },

    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          web3: ['@wagmi/core', 'viem', '@rainbow-me/rainbowkit']
        },
        plugins: [
          {
            name: 'preload-helper',
            generateBundle(options, bundle) {
              Object.values(bundle).forEach((chunk) => {
                if (chunk.type === 'chunk' && chunk.isEntry) {
                  chunk.imports.forEach((importFile) => {
                    const importChunk = bundle[importFile];
                    if (importChunk) {
                      importChunk.isPreload = true;
                    }
                  });
                }
              });
            }
          }
        ]
      }
    }
  },

  optimizeDeps: {
    include: ['react', 'react-dom', '@rainbow-me/rainbowkit', 'wagmi', 'viem', 'ethers']
  }
})
