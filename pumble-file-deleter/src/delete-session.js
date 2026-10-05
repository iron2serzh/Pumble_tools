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

  async function deleteCurrentPage(doc, options) {
    const rows = [...api.listFileRows(doc)];
    const selectAll = doc.querySelector(SELECT_ALL);
    if (!selectAll) return { ok: false, rows };
    selectAll.click();

    const trash = await poll(options, () => doc.querySelector(DELETE_BUTTON));
    if (!trash) return { ok: false, rows };
    trash.click();

    const confirm = await poll(
      { ...options, timeoutMs: Math.min(options.timeoutMs ?? 4000, 1200) },
      () => doc.querySelector(CONFIRM),
    );
    if (confirm) {
      confirm.setAttribute('data-pumble-tools-used', '1');
      confirm.click();
    }
    return { ok: true, rows };
  }

  async function switchToPage(doc, number, options) {
    const parts = paginationParts(doc);
    const node = parts?.numbers.find((item) => pageNumber(item) === number);
    if (!node || node === parts.next || node === parts.previous) return false;
    clickable(node).click();
    await pause(options, PAUSE_MS);
    return true;
  }

  api.deleteListedFiles = async function deleteListedFiles(doc, options = {}) {
    let done = 0;
    let failed = 0;
    let stopped = false;
    let outcome = 'done';
    const seen = new Set();
    const initialTotal = api.readFileTotal(doc);

    try {
      while (!stopped) {
        throwIfAborted(options);
        if (api.readFileTotal(doc) === 0) {
          outcome = 'done';
          break;
        }

        const parts = paginationParts(doc);
        const numbers = (parts?.numbers || []).map(pageNumber).filter((value) => value != null);
        const max = numbers.length ? Math.max(...numbers) : null;
        const single = numbers.length <= 1;

        if (!single) {
          const opened = await switchToPage(doc, max, options);
          if (!opened) {
            outcome = 'blocked';
            break;
          }
        }

        throwIfAborted(options);
        let rows = [...api.listFileRows(doc)];
        if (rows.length === 0) {
          const appeared = await poll(options, () => api.listFileRows(doc).length > 0);
          if (appeared) rows = [...api.listFileRows(doc)];
        }
        if (rows.length === 0) {
          outcome = done > 0 ? 'header' : 'blocked';
          break;
        }

        const signature = signatureOf(rows);
        if (seen.has(signature)) {
          outcome = 'unchanged';
          break;
        }
        seen.add(signature);
        const page = api.readCurrentPage(doc);

        let deletion;
        try {
          deletion = await deleteCurrentPage(doc, options);
        } catch (error) {
          if (options.signal?.aborted || error?.name === 'AbortError') {
            stopped = true;
            break;
          }
          failed += rows.length;
          outcome = 'blocked';
          break;
        }
        if (!deletion.ok) {
          outcome = 'blocked';
          break;
        }

        let gone = deletion.rows.filter((row) => !row.isConnected);
        if (gone.length > 0) {
          done += gone.length;
          if (typeof options.onProgress === 'function') {
            options.onProgress({
              done,
              failed,
              total: initialTotal ?? done,
              stopped: false,
              page,
            });
          }
        }
        throwIfAborted(options);
        await pause(options, PAUSE_MS);
        throwIfAborted(options);
        if (gone.length === 0) {
          gone = deletion.rows.filter((row) => !row.isConnected);
          if (gone.length === 0) {
            outcome = 'unchanged';
            break;
          }
          done += gone.length;
          if (typeof options.onProgress === 'function') {
            options.onProgress({
              done,
              failed,
              total: initialTotal ?? done,
              stopped: false,
              page,
            });
          }
        }
        if (api.readFileTotal(doc) === 0) {
          outcome = 'done';
          break;
        }
        if (single) {
          outcome = 'header';
          break;
        }

        const back = await switchToPage(doc, 1, options);
        if (!back) {
          outcome = 'blocked';
          break;
        }
      }
    } catch (error) {
      if (options.signal?.aborted || error?.name === 'AbortError') stopped = true;
      else throw error;
    }

    if (!stopped && outcome === 'done' && api.readFileTotal(doc) > 0) {
      outcome = done === 0 ? 'blocked' : 'header';
    }

    return { done, failed, total: initialTotal ?? done, stopped, outcome };
  };
})(globalThis);
