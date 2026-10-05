(function (root) {
  const api = (root.PumbleFileDeleter = root.PumbleFileDeleter || {});
  const CONFIRM_SELECTOR = [
    '.modal-dialog__footer button.primary-button:not([data-pumble-tools-used])',
    '.modal-dialog__footer button.MuiButton-containedPrimary:not([data-pumble-tools-used])',
  ].join(', ');

  function findSelectAll(doc) {
    const browser = doc.querySelector('.file-browser');
    if (!browser) return null;
    return [...browser.querySelectorAll('input[type="checkbox"], [role="checkbox"]')]
      .find((box) => !box.closest('.file-browser__list')) || null;
  }

  function findSelectionBar(doc) {
    const browser = doc.querySelector('.file-browser');
    if (!browser) return null;
    const matches = [...browser.querySelectorAll('div, section, header')].filter((el) => {
      if (el.hidden || el.hasAttribute('hidden')) return false;
      if (el.closest('.file-browser__list')) return false;
      if (el.querySelector('.file-browser__list')) return false;
      if (!el.querySelector('button')) return false;
      return /\d+\s+(Selected|zaznaczon\w*)/i.test(el.textContent || '');
    });
    matches.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
    return matches[0] || null;
  }

  function findTrash(bar) {
    const buttons = [...bar.querySelectorAll('button')].filter((button) => !button.disabled);
    return buttons.length > 0 ? buttons[buttons.length - 1] : null;
  }

  function findNextPage(doc) {
    const pagination = doc.querySelector('.file-browser .file-browser__pagination');
    if (!pagination) return null;
    return [...pagination.querySelectorAll('button, a')].find((control) => {
      if (control.disabled || control.getAttribute('aria-disabled') === 'true') return false;
      const label = `${control.getAttribute('aria-label') || ''} ${control.getAttribute('title') || ''}`.trim();
      return /^(next page|następna strona|nastepna strona)$/i.test(label);
    }) || null;
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
    const selectAll = findSelectAll(doc);
    if (!selectAll) throw new Error('brak zaznacz wszystko');
    selectAll.click();

    const bar = await poll(options, () => findSelectionBar(doc));
    if (!bar) throw new Error('brak paska zaznaczenia');
    const trash = findTrash(bar);
    if (!trash) throw new Error('brak kosza');
    trash.click();

    const confirm = await poll(
      { ...options, timeoutMs: Math.min(options.timeoutMs ?? 4000, 400) },
      () => doc.querySelector(CONFIRM_SELECTOR),
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
    let page = 0;
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
      page += 1;

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
        options.onProgress({ done, failed, total: done, stopped: false, page });
      }
      if (options.signal?.aborted) {
        stopped = true;
        break;
      }

      const next = findNextPage(doc);
      if (!next) break;
      next.click();
      const changed = await poll(options, () => {
        const current = api.listFileRows(doc);
        if (current.length === 0) return false;
        const nextSignature = signatureOf(current);
        return nextSignature !== signature ? nextSignature : false;
      });
      if (!changed) break;
    }

    return { done, failed, total: done, stopped, page };
  };
})(globalThis);
