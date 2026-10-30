import assert from "node:assert/strict";
import { test } from "node:test";
import { createAsyncCache } from "../src/lib/async-cache.ts";

test("concurrent requests share a value until its development TTL expires", async () => {
  let time = 0;
  let calls = 0;
  const get = createAsyncCache(async () => ++calls, { maxAgeMs: 60_000, now: () => time });
  const first = get();
  assert.equal(get(), first);
  assert.equal(await first, 1);
  time = 59_999;
  assert.equal(await get(), 1);
  time = 60_000;
  assert.equal(await get(), 2);
});

test("a rejected request does not poison subsequent requests", async () => {
  let calls = 0;
  const get = createAsyncCache(async () => {
    if (++calls === 1) throw new Error("temporary outage");
    return "recovered";
  });
  await assert.rejects(get(), /temporary outage/);
  assert.equal(await get(), "recovered");
  assert.equal(await get(), "recovered");
  assert.equal(calls, 2);
});

test("slow in-flight requests are not duplicated when the TTL passes", async () => {
  let time = 0;
  let finish!: (value: string) => void;
  const get = createAsyncCache(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    {
      maxAgeMs: 10,
      now: () => time,
    },
  );
  const first = get();
  await Promise.resolve();
  time = 100;
  assert.equal(get(), first);
  finish("ready");
  assert.equal(await first, "ready");
  assert.equal(await get(), "ready");
});
