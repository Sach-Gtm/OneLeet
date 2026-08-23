import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Progressive Web App: installable to the home screen, opens standalone
    // (no browser chrome), with an app-shell service worker. It precaches ONLY
    // the SPA shell + its JS/CSS assets — never the 210 pre-rendered /leet +
    // /guides SEO pages, and never the cross-origin API or Razorpay (those are
    // a different origin, so the worker can't touch them anyway).
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      workbox: {
        // Bring the Web Push handlers (push + notificationclick) into the
        // generated worker so background notifications keep working under the PWA.
        importScripts: ["/push-sw.js"],
        globPatterns: ["**/*.{js,css,woff2}", "index.html", "favicon.svg", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
        globIgnores: ["**/leet/**", "**/guides/**", "push-sw.js"],
        navigateFallback: "/index.html",
        // Real static docs (and non-SPA files) must NOT fall back to the SPA shell.
        navigateFallbackDenylist: [/^\/leet\//, /^\/guides\//, /^\/api\//, /\.xml$/, /\.txt$/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "OneLeet, LEET Preparation",
        short_name: "OneLeet",
        description:
          "Crack LEET (Lateral Entry Entrance Test) and get into 2nd-year B.Tech after your diploma: past papers, exam-pattern mock tests, notes and AI practice.",
        lang: "en-IN",
        theme_color: "#ffffff",
        background_color: "#FAF9F6",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/dashboard",
        categories: ["education"],
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
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
