import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },

  // Ton app Vite est dans /client
  root: path.resolve(import.meta.dirname, "client"),

  // public/ est dans /client/public
  publicDir: path.resolve(import.meta.dirname, "client", "public"),

  build: {
    // ✅ IMPORTANT: build vers /dist à la RACINE du repo
    // car Vercel Output Directory = "dist"
    outDir: path.resolve(import.meta.dirname, "dist"),

    emptyOutDir: true,

    // Pour retrouver les lignes dans les erreurs en prod
    sourcemap: true,
  },
});
