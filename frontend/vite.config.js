import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    open: '/login', // สั่งให้ตอนรัน dev server เปิดหน้าต่างเบราว์เซอร์ไปที่ path /login ทันที
  },
})