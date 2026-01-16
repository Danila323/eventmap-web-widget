import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'EventMapWidget',
      fileName: 'widget',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        // Улучшаем именование для CSS
        assetFileNames: 'widget.[ext]',
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        pure_funcs: ['console.log'],
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
