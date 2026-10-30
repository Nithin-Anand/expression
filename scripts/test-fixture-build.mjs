import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const env = {
  ...process.env,
  PUBLIC_CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  BUILD_OUTPUT_DIR: "dist-fixture",
};

function run(args) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const require = createRequire(import.meta.url);
const astroPackage = require.resolve("astro/package.json");
const astroCli = resolve(
  dirname(astroPackage),
  JSON.parse(readFileSync(astroPackage, "utf8")).bin.astro,
);
run([astroCli, "build", "--config", "astro.config.fixture.mjs"]);
run([
  "--test",
  ...readdirSync("tests/build")
    .filter((file) => file.endsWith(".test.mjs"))
    .map((file) => `tests/build/${file}`),
]);
