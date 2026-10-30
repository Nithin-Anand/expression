import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const output = process.env.BUILD_OUTPUT_DIR ?? "dist";
const html = (path) => readFileSync(join(output, path, "index.html"), "utf8");
const files = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
  );

test("crawler and cache policies are included in the deployable output", () => {
  for (const file of ["robots.txt", "_headers"]) {
    assert.equal(
      readFileSync(join(output, file), "utf8"),
      readFileSync(join("public", file), "utf8"),
    );
  }
});

test("synthetic catalogs are restricted to the explicit fixture build", () => {
  const stats = JSON.parse(readFileSync(join(output, "stats.json"), "utf8"));
  const hasFixturePhotos = stats.recently_added.some((photo) =>
    photo.public_id.startsWith("fixture/"),
  );
  assert.equal(hasFixturePhotos, output === "dist-fixture");
});

test("draft frontmatter prevents both public routes and blog index links", () => {
  for (const file of files("src/content/blog").filter((file) => file.endsWith(".md"))) {
    const frontmatter = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    if (!/^draft:\s*true\s*$/im.test(frontmatter)) continue;
    const id = file.replace(/^src\/content\/blog\//, "").replace(/\.md$/, "");
    assert.equal(existsSync(join(output, "blog", id, "index.html")), false, id);
    assert.ok(!html("blog").includes(`/blog/${id}/`), id);
  }
});

test("portfolio routes contain photographs and never display the sorting date", () => {
  const stats = JSON.parse(readFileSync(join(output, "stats.json"), "utf8"));
  for (const route of ["", "gallery/portfolio"]) {
    const page = html(route);
    assert.equal(
      (page.match(/<button\b[^>]*\sdata-lightbox(?:\s|=|>)/g) ?? []).length,
      stats.portfolio_count,
    );
    assert.ok(!page.includes("2050"));
    assert.ok(page.includes('aria-label="Photo viewer"'));
  }
  assert.ok(html("portfolio").includes("/gallery/portfolio/"));
});

test("photo essays, image priority, descriptions, and canonical URLs survive the migration", () => {
  const page = html("gallery/france_2026");
  assert.ok(page.includes("Cartier-Bresson"));
  assert.ok(page.includes('loading="eager"') && page.includes('loading="lazy"'));
  assert.ok(!page.includes("style:list"));
  for (const route of ["", "gallery", "blog", "blog/five-beginner-photographer-tips", "stats"]) {
    const page = html(route);
    assert.ok(!page.includes("undefined |"), route);
    assert.match(page, /<meta name="description" content="[^"]+"/);
    assert.match(page, /<link rel="canonical" href="https:\/\/minimallyphotos.com\//);
  }
});

test("all internal page links resolve and recent photos use transformed image URLs", () => {
  for (const file of files(output).filter((file) => file.endsWith(".html"))) {
    const page = readFileSync(file, "utf8");
    for (const [, href] of page.matchAll(/<a\b[^>]*href="(\/[^"#?]*)"/g)) {
      const path = join(output, decodeURIComponent(href));
      assert.ok(existsSync(path) || existsSync(join(path, "index.html")), `${file}: ${href}`);
    }
  }
  const stats = JSON.parse(readFileSync(join(output, "stats.json"), "utf8"));
  assert.equal(
    new Set(stats.upload_timeline.map((day) => day.date)).size,
    stats.upload_timeline.length,
  );
  for (const photo of stats.recently_added)
    assert.ok(photo.url.includes("w_480") && photo.url.includes("f_auto"));
});
