import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const staticHtml = {
  "/besoin": "/besoin/index.html",
  "/besoin/": "/besoin/index.html",
  "/confidentialite": "/confidentialite/index.html",
  "/confidentialite/": "/confidentialite/index.html",
  "/cgu": "/cgu/index.html",
  "/cgu/": "/cgu/index.html",
  "/cgv": "/cgv/index.html",
  "/cgv/": "/cgv/index.html",
  "/contact": "/contact/index.html",
  "/contact/": "/contact/index.html",
  "/mentions": "/mentions/index.html",
  "/mentions/": "/mentions/index.html",
  "/stores": "/stores/index.html",
  "/stores/": "/stores/index.html",
  "/supprimer": "/supprimer/index.html",
  "/supprimer/": "/supprimer/index.html",
  "/regles": "/regles/index.html",
  "/regles/": "/regles/index.html",
  "/introuvable": "/introuvable/index.html",
  "/introuvable/": "/introuvable/index.html",
  "/admin": "/admin/index.html",
  "/admin/": "/admin/index.html",
};

function serveStaticHtml() {
  function rewrite(req) {
    const path = req.url?.split("?")[0] || "";
    if (staticHtml[path]) req.url = staticHtml[path];
  }
  return {
    name: "serve-static-html",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveStaticHtml()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@clerk")) return "clerk";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("\\react\\")) return "react";
          return undefined;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api/lead": "http://127.0.0.1:4192",
      "/api/event": "http://127.0.0.1:4192",
      "/api/health": "http://127.0.0.1:4192",
      // Dev : campagnes / IAP / etc. depuis la prod (sinon l’accueil local reste vide).
      "/api": {
        target: "https://gemelo.online",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    allowedHosts: [".trycloudflare.com"],
  },
});
