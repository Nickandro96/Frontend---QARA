import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // Le projet Vite est dans /client
  root: path.resolve(import.meta.dirname, "client"),

  // Dossier public relatif au root Vite
  publicDir: "public",

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      // Comme root=/client, @ doit pointer vers /client/src
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },

  build: {
    // IMPORTANT: outDir est relatif à root (/client) => /client/dist
    // Vercel détecte très bien ce dist
    outDir: "dist",
    emptyOutDir: true,

    // Pour stacktraces exploitables en prod (React error #310)
    sourcemap: true,
  },
});
