import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['blockly', 'blockly/python', 'blockly/core', 'blockly/blocks', 'blockly/msg/en'],
  },
  build: {
    commonjsOptions: {
      include: [/blockly/, /node_modules/],
    },
  },
})
