(function (root) {
  const api = (root.PumbleFileDeleter = root.PumbleFileDeleter || {});
  const SELECT_ALL = '.file-browser .header-actions__actions .header-actions__checkbox input';
  const DELETE_BUTTON = '.file-browser .header-actions__actions > div:nth-child(5) > button';
  const CONFIRM = '.modal-dialog__footer button.confirmation-modal__confirm-btn:not([data-pumble-tools-used])';

  function elementChildren(node) {
    return [...node.childNodes].filter((child) => child.nodeType === 1);
  }

  function findForwardArrow(doc) {
    const ul = doc.querySelector('.file-browser .file-browser__pagination nav > ul');
    if (!ul) return null;
    const nodes = elementChildren(ul);
    return nodes.length > 0 ? nodes[nodes.length - 1] : null;
  }

  function clickable(node) {
    if (!node) return null;
    if (node.matches && node.matches('button, input')) return node;
    return node.querySelector?.('button, input') || node;
  }

  function isDisabled(node) {
    const control = clickable(node);
    if (!control) return true;
    return Boolean(
      control.disabled
      || control.getAttribute('aria-disabled') === 'true'
      || node.getAttribute?.('aria-disabled') === 'true',
    );
  }

  function signatureOf(rows) {
    return rows.map((row, index) => row.dataset.fileId || `row-${index}`).join('|');
  }

  async function poll(options, read) {
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
      const found = read();
      if (found) return found;
      await sleep(intervalMs);
    }
    return null;
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

  api.deleteListedFiles = async function deleteListedFiles(doc, options = {}) {
    let done = 0;
    let failed = 0;
    let stopped = false;
    const seen = new Set();

    while (!stopped) {
      if (options.signal?.aborted) {
        stopped = true;
        break;
      }

      const rows = [...api.listFileRows(doc)];
      if (rows.length === 0) break;
      const signature = signatureOf(rows);
      if (seen.has(signature)) break;
      seen.add(signature);
      const page = api.readCurrentPage(doc);

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

      const total = api.readFileTotal(doc) ?? done;
      if (typeof options.onProgress === 'function') {
        options.onProgress({ done, failed, total, stopped: false, page });
      }
      if (options.signal?.aborted) {
        stopped = true;
        break;
      }

      const arrow = findForwardArrow(doc);
      if (!arrow || isDisabled(arrow)) break;
      clickable(arrow).click();
      const changed = await poll(options, () => {
        const current = api.listFileRows(doc);
        if (current.length === 0) return false;
        const nextSignature = signatureOf(current);
        return nextSignature !== signature ? nextSignature : false;
      });
      if (!changed) break;
    }

    return { done, failed, total: api.readFileTotal(doc) ?? done, stopped };
  };
})(globalThis);
