import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

// Read package.json to get the version reliably in production environments
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],


      // 1. Force the service worker to check for updates more frequently
      devOptions: {
        enabled: true,
      },
      workbox: {
        // Force the new SW to activate immediately without waiting
        // These are baked directly into sw.js, independent of registerType
        skipWaiting: true,
        clientsClaim: true,
        // Unique cacheId per build ensures sw.js content ALWAYS changes between deployments
        cacheId: `cader-${Date.now()}`,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
      },

      manifest: {
        name: "Cader",
        short_name: "Cader",
        description: "Cader | Geospatial Survey & Engineering Platform",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        display: "standalone",
        display_override: ["standalone", "minimal-ui", "browser"],
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable", // improves Android adaptive icons
          },
        ],
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          mui: ["@mui/material"],
          icons: ["react-icons"],
        },
      },
    },
  },

  preview: {
    port: 8080,
    host: true,
    allowedHosts: ["cader-8kvsl.ondigitalocean.app", "getcader.com"],
  },

  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString("EN-IN")),
  },
});
