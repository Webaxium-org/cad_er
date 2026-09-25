import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],


      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cacheId: "cader",
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // A precached index.html keeps serving old bundles on repeat visits.
        // Fetch navigations from the network and retain a cached offline copy.
        globIgnores: ["**/index.html"],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" &&
              url.origin === self.location.origin &&
              url.pathname !== "/api" &&
              !url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "cader-pages",
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
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

});
