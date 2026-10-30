import assert from "node:assert/strict";
import { test } from "node:test";
import { getCloudinaryImageUrl } from "../src/lib/cloudinary.ts";

test("image URLs use HTTPS, the configured cloud, and explicit thumbnail or lightbox transformations", () => {
  const original = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  process.env.PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
  try {
    const thumbnail = getCloudinaryImageUrl({
      src: "sample",
      width: 480,
      height: 320,
      crop: "fill",
      gravity: "center",
    });
    const lightbox = getCloudinaryImageUrl({ src: "sample", width: 1920, format: "webp" });
    assert.ok(thumbnail.startsWith("https://res.cloudinary.com/demo/image/upload/"));
    for (const transformation of ["c_fill", "h_320", "w_480", "f_auto", "q_auto"])
      assert.ok(thumbnail.includes(transformation));
    assert.ok(lightbox.includes("f_webp") && lightbox.includes("w_1920"));
    delete process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
    assert.throws(
      () => getCloudinaryImageUrl({ src: "sample", width: 480 }),
      /CLOUDINARY_CLOUD_NAME/,
    );
  } finally {
    if (original === undefined) delete process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
    else process.env.PUBLIC_CLOUDINARY_CLOUD_NAME = original;
  }
});
