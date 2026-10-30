import { mergeConfig } from "astro/config";
import config from "./astro.config.mjs";

// CI exercises real route generation with public, synthetic metadata and no API credentials.
export default mergeConfig(config, {
  outDir: "./dist-fixture",
  vite: { define: { __PHOTO_CATALOG_FIXTURE__: "true" } },
});
