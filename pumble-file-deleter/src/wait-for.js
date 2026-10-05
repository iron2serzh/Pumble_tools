(function (root) {
  root.PumbleFileDeleter = root.PumbleFileDeleter || {};

  root.PumbleFileDeleter.waitFor = async function waitFor(doc, selector, options = {}) {
    const timeoutMs = options.timeoutMs ?? 4000;
    const now = options.now || (() => Date.now());
    const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const intervalMs = options.intervalMs ?? 50;
    const start = now();

    while (now() - start <= timeoutMs) {
      if (options.signal?.aborted) {
        const error = new Error('aborted');
        error.name = 'AbortError';
        throw error;
      }
      const found = doc.querySelector(selector);
      if (found) return found;
      await sleep(intervalMs);
    }

    throw new Error(`nie znaleziono: ${selector}`);
  };
})(globalThis);
