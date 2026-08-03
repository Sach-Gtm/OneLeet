import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the big shared libraries into their own long-cached chunks so the
        // landing page's entry stays small and vendor code caches across deploys.
        // Route-only libs (zod, react-hook-form, …) are left to Vite's automatic
        // per-route splitting instead of being forced into one giant vendor chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return "react-vendor";
          if (id.includes("framer-motion") || /[\\/]node_modules[\\/]motion[\\/]/.test(id)) return "motion";
          if (id.includes("ogl")) return "ogl";
        },
      },
    },
  },
});
