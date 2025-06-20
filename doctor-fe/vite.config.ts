import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    include: ['ethers']
  },
  css: {
    postcss: './postcss.config.cjs'
  }
});
