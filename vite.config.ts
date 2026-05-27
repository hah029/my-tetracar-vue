import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue(), glsl()],
  assetsInclude: ["**/*.glb", "**/*.ogg"],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), // @ указывает на папку src
    },
  },
});
