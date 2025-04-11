import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    port: 3000,
    strictPort: true, // Fail if port is already in use
    open: true, // Open browser on start
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})