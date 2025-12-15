import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/quantum-tic-tac-toe/', 
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})

