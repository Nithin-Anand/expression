/** Share in-flight work, expire successful values, and allow retries after failures. */
export function createAsyncCache<T>(
  load: () => Promise<T>,
  { maxAgeMs = Infinity, now = Date.now }: { maxAgeMs?: number; now?: () => number } = {},
): () => Promise<T> {
  let cached: Promise<T> | undefined;
  let expiresAt = 0;
  return () => {
    if (!cached || now() >= expiresAt) {
      expiresAt = Infinity;
      const pending = Promise.resolve().then(load);
      cached = pending;
      pending.then(
        () => {
          if (cached === pending) expiresAt = now() + maxAgeMs;
        },
        () => {
          if (cached === pending) cached = undefined;
        },
      );
    }
    return cached;
  };
}
