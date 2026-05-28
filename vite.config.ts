import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/flux-icon.svg", "icons/flux-maskable.svg"],
      manifest: {
        name: "Flux",
        short_name: "Flux",
        description: "本地优先的月经周期与身体状态记录工具",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#A7B8A4",
        background_color: "#F6F1EA",
        icons: [
          {
            src: "/icons/flux-icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/flux-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],
});
