(function (root) {
  const api = (root.PumbleFileDeleter = root.PumbleFileDeleter || {});
  const SELECT_ALL = '.file-browser .header-actions__actions .header-actions__checkbox input';
  const DELETE_BUTTON = '.file-browser .header-actions__actions > div:nth-child(5) > button';
  const CONFIRM = '.modal-dialog__footer button.confirmation-modal__confirm-btn:not([data-pumble-tools-used])';
  const PAUSE_MS = 1000;

  function elementChildren(node) {
    return [...node.childNodes].filter((child) => child.nodeType === 1);
  }

  function paginationParts(doc) {
    const ul = doc.querySelector('.file-browser .file-browser__pagination nav > ul');
    if (!ul) return null;
    const nodes = elementChildren(ul);
    if (nodes.length < 3) return null;
    return {
      previous: nodes[0],
      numbers: nodes.slice(1, -1),
      next: nodes[nodes.length - 1],
    };
  }

  function pageNumber(node) {
    const value = Number((node?.textContent || '').trim());
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function clickable(node) {
    if (!node) return null;
    if (node.matches && node.matches('button, input')) return node;
    return node.querySelector?.('button, input') || node;
  }

  function signatureOf(rows) {
    return rows.map((row, index) => row.dataset.fileId || `row-${index}`).join('|');
  }

  function abortError() {
    const error = new Error('aborted');
    error.name = 'AbortError';
    return error;
  }

  function throwIfAborted(options) {
    if (options.signal?.aborted) throw abortError();
  }

  async function poll(options, read) {
    const timeoutMs = options.timeoutMs ?? 4000;
    const now = options.now || (() => Date.now());
    const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const intervalMs = options.intervalMs ?? 50;
    const start = now();

    while (now() - start <= timeoutMs) {
      throwIfAborted(options);
      const found = read();
      if (found) return found;
      await sleep(intervalMs);
    }
    return null;
  }

  async function pause(options, ms = PAUSE_MS) {
    if (typeof options.onPhase === 'function') options.onPhase('wait');
    const sleep = options.sleep || ((delay) => new Promise((resolve) => setTimeout(resolve, delay)));
    try {
      const step = 50;
      for (let elapsed = 0; elapsed < ms; elapsed += step) {
        throwIfAborted(options);
        await sleep(Math.min(step, ms - elapsed));
      }
      throwIfAborted(options);
    } finally {
      if (typeof options.onPhase === 'function') options.onPhase('idle');
    }
  }

  async function deleteCurrentPage(doc, rows, options) {
    const selectAll = doc.querySelector(SELECT_ALL);
    if (!selectAll) throw new Error('brak zaznacz wszystko');
    selectAll.click();

    const trash = await poll(options, () => doc.querySelector(DELETE_BUTTON));
    if (!trash) throw new Error('brak kosza');
    trash.click();

    const confirm = await poll(
      { ...options, timeoutMs: Math.min(options.timeoutMs ?? 4000, 1200) },
      () => doc.querySelector(CONFIRM),
    );
    if (confirm) {
      confirm.setAttribute('data-pumble-tools-used', '1');
      confirm.click();
    }

    const cleared = await poll(options, () => rows.every((row) => !row.isConnected));
    if (!cleared) throw new Error('strona nie zniknęła');
  }

  async function switchToPage(doc, number, options) {
    const parts = paginationParts(doc);
    const node = parts?.numbers.find((item) => pageNumber(item) === number);
    if (!node || node === parts.next || node === parts.previous) return false;
    clickable(node).click();
    await pause(options, PAUSE_MS);
    return api.readCurrentPage(doc) === number && api.listFileRows(doc).length > 0;
  }

  api.deleteListedFiles = async function deleteListedFiles(doc, options = {}) {
    let done = 0;
    let failed = 0;
    let stopped = false;
    const seen = new Set();
    const initialTotal = api.readFileTotal(doc);

    try {
      while (!stopped) {
        throwIfAborted(options);
        if (api.readFileTotal(doc) === 0) break;

        const parts = paginationParts(doc);
        const numbers = (parts?.numbers || []).map(pageNumber).filter((value) => value != null);
        const max = numbers.length ? Math.max(...numbers) : null;
        const single = numbers.length <= 1;

        if (!single) {
          if (api.readCurrentPage(doc) !== max) {
            const opened = await switchToPage(doc, max, options);
            if (!opened) break;
          }
        }

        throwIfAborted(options);
        const rows = [...api.listFileRows(doc)];
        if (rows.length === 0) break;
        const signature = signatureOf(rows);
        if (seen.has(signature)) break;
        seen.add(signature);
        const page = api.readCurrentPage(doc);
        const before = api.readFileTotal(doc);

        try {
          await deleteCurrentPage(doc, rows, options);
          done += rows.length;
        } catch (error) {
          if (options.signal?.aborted || error?.name === 'AbortError') {
            stopped = true;
            break;
          }
          failed += rows.length;
          break;
        }

        if (typeof options.onProgress === 'function') {
          options.onProgress({
            done,
            failed,
            total: initialTotal ?? done,
            stopped: false,
            page,
          });
        }
        throwIfAborted(options);
        await pause(options, PAUSE_MS);
        throwIfAborted(options);

        const mid = api.readFileTotal(doc);
        const cleared = api.listFileRows(doc).length === 0;
        if (mid === 0) break;
        if (single && (cleared || (before != null && mid != null && mid >= before))) break;

        const back = await switchToPage(doc, 1, options);
        if (!back) break;
        const after = api.readFileTotal(doc);
        if (after === 0) break;
        if (before != null && after != null && after >= before) break;
      }
    } catch (error) {
      if (options.signal?.aborted || error?.name === 'AbortError') stopped = true;
      else throw error;
    }

    return { done, failed, total: initialTotal ?? done, stopped };
  };
})(globalThis);
