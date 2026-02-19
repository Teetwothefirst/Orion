import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://orion-3.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://teetwothefirst.github.io'
        }
      },
    },
  },
})
