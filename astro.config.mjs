// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://minimallyphotos.com",
  vite: {
    define: { __PHOTO_CATALOG_FIXTURE__: "false" },
    plugins: [tailwindcss()],
  },
});
