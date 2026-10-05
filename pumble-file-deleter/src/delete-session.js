(function (root) {
  const api = (root.PumbleFileDeleter = root.PumbleFileDeleter || {});
  const SELECT_ALL = '.file-browser .header-actions .header-actions__actions .pmbl-checkbox.header-actions__checkbox input';
  const SELECT_BOX = '.file-browser .header-actions .header-actions__actions .pmbl-checkbox.header-actions__checkbox';
  const DELETE_BUTTON = '.file-browser .header-actions .header-actions__actions > div:nth-child(5) > button';
  const CONFIRM = 'button.confirmation-modal__confirm-btn:not([data-pumble-tools-used])';
  const SORT_ROOT = '.file-browser .sort-dropdown.file-browser__sort';
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

  function note(options, label) {
    if (typeof options.onStep === 'function') options.onStep(label);
  }

  function pointerClick(node) {
    const view = node.ownerDocument.defaultView;
    const init = { bubbles: true, cancelable: true, view, button: 0 };
    const Pointer = view.PointerEvent || view.MouseEvent;
    node.dispatchEvent(new Pointer('pointerdown', init));
    node.dispatchEvent(new view.MouseEvent('mousedown', init));
    node.dispatchEvent(new view.MouseEvent('mouseup', init));
    node.dispatchEvent(new view.MouseEvent('click', init));
  }

  function newTrash(doc, preexisting) {
    const button = doc.querySelector(DELETE_BUTTON);
    if (!button || button === preexisting) return null;
    return button;
  }

  function selectionLabel(doc) {
    const actions = doc.querySelector('.file-browser .header-actions');
    return /selected/i.test(actions?.textContent || '');
  }

  function pageListText(doc) {
    const parts = paginationParts(doc);
    if (!parts) return '';
    return parts.numbers.map((node) => (node.textContent || '').trim()).join(',');
  }

  function viewSignature(doc) {
    return `${api.readFileTotal(doc)}|${pageListText(doc)}`;
  }

  function selectDetail(inputFound, trashAppeared) {
    return `Input: ${inputFound ? 'tak' : 'nie'}. Kosz: ${trashAppeared ? 'tak' : 'nie'}.`;
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
    const beforeHeader = api.readFileTotal(doc);
    const selectAll = doc.querySelector(SELECT_ALL);
    const selectBox = doc.querySelector(SELECT_BOX);
    note(options, 'Zaznaczam');
    if (!selectAll && !selectBox) {
      return { ok: false, failedStep: 'Zaznaczam', detail: selectDetail(false, false), rows, beforeHeader };
    }
    const preexisting = doc.querySelector(DELETE_BUTTON);
    if (selectAll) selectAll.click();
    await pause(options, PAUSE_MS);
    let trash = newTrash(doc, preexisting);
    const selected = () => Boolean(trash) || selectionLabel(doc);
    if (!selected() && selectBox) {
      pointerClick(selectBox);
      await pause(options, PAUSE_MS);
      trash = newTrash(doc, preexisting);
    }
    if (!trash) trash = await poll(options, () => newTrash(doc, preexisting));
    if (!trash) {
      return {
        ok: false,
        failedStep: selected() ? 'Klikam kosz' : 'Zaznaczam',
        detail: selected() ? undefined : selectDetail(Boolean(selectAll), false),
        rows,
        beforeHeader,
      };
    }

    note(options, 'Klikam kosz');
    if (!trash) {
      trash = await poll(options, () => newTrash(doc, preexisting));
    }
    if (!trash) return { ok: false, failedStep: 'Klikam kosz', rows, beforeHeader };
    trash.click();
    await pause(options, PAUSE_MS);

    note(options, 'Potwierdzam');
    const confirm = await poll(
      { ...options, timeoutMs: Math.min(options.timeoutMs ?? 4000, 1200) },
      () => doc.querySelector(CONFIRM),
    );
    const afterClick = api.readFileTotal(doc);
    if (!confirm) {
      if (beforeHeader != null && afterClick != null && afterClick < beforeHeader) {
        return { ok: true, rows, beforeHeader, confirmed: false };
      }
      return { ok: false, failedStep: 'Potwierdzam', rows, beforeHeader };
    }
    confirm.setAttribute('data-pumble-tools-used', '1');
    confirm.click();
    return { ok: true, rows, beforeHeader, confirmed: true };
  }

  async function clickPageNumber(doc, number, options) {
    const parts = paginationParts(doc);
    const node = parts?.numbers.find((item) => pageNumber(item) === number);
    if (!node || node === parts.next || node === parts.previous) return false;
    clickable(node).click();
    await pause(options, PAUSE_MS);
    return true;
  }

  async function switchToPage(doc, number, options) {
    const parts = paginationParts(doc);
    const node = parts?.numbers.find((item) => pageNumber(item) === number);
    if (!node || node === parts.next || node === parts.previous) return false;
    note(options, number === 1 ? 'Strona 1' : `Strona ${number}`);
    return clickPageNumber(doc, number, options);
  }

  async function pickSort(doc, options, index) {
    const root = doc.querySelector(SORT_ROOT);
    const toggle = root?.querySelector(':scope > span');
    if (!toggle) return false;
    toggle.click();
    await pause(options, PAUSE_MS);
    const items = [...root.querySelectorAll('.dropdown-menu-dialog > div > div')];
    if (!items[index]) return false;
    items[index].click();
    await pause(options, PAUSE_MS);
    return true;
  }

  async function refreshBySort(doc, options, before) {
    if (!doc.querySelector(SORT_ROOT)) return false;
    if (!await pickSort(doc, options, 1)) return false;
    const changed = viewSignature(doc) !== before;
    await pickSort(doc, options, 0);
    return changed || viewSignature(doc) !== before;
  }

  async function refreshByPageHop(doc, options, before, deletedPage) {
    const parts = paginationParts(doc);
    if (!parts) return false;
    const values = parts.numbers.map(pageNumber).filter((value) => value);
    const other = values.find((value) => value !== 1 && value !== deletedPage) || values.find((value) => value !== 1);
    if (!other) return false;
    await clickPageNumber(doc, other, options);
    await clickPageNumber(doc, 1, options);
    return viewSignature(doc) !== before;
  }

  async function refreshByFilter(doc, options, before) {
    const button = doc.querySelector('.file-browser .file-browser__actions [aria-pressed="true"]');
    if (!button) return false;
    button.click();
    await pause(options, PAUSE_MS);
    return viewSignature(doc) !== before;
  }

  async function forceRefresh(doc, options, deletedPage) {
    const before = viewSignature(doc);
    note(options, 'Odświeżam');
    if (doc.querySelector(SORT_ROOT)) {
      const changed = await refreshBySort(doc, options, before);
      if (changed) return 'sort';
    }
    if (await refreshByPageHop(doc, options, before, deletedPage)) return 'page';
    if (await refreshByFilter(doc, options, before)) return 'filter';
    return null;
  }

  api.deleteListedFiles = async function deleteListedFiles(doc, options = {}) {
    let done = 0;
    let failed = 0;
    let stopped = false;
    let outcome = 'done';
    let failedStep = null;
    let detail = null;
    let refresh = null;
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
        if (single && api.listFileRows(doc).length === 0) {
          outcome = 'header';
          break;
        }

        if (!single) {
          const opened = await switchToPage(doc, max, options);
          if (!opened) {
            outcome = 'blocked';
            failedStep = `Strona ${max}`;
            break;
          }
        }

        throwIfAborted(options);
        const rows = [...api.listFileRows(doc)];
        const signature = signatureOf(rows);
        if (rows.length > 0 && seen.has(signature)) {
          outcome = 'unchanged';
          failedStep = 'Zaznaczam';
          break;
        }
        if (rows.length > 0) seen.add(signature);
        const page = max || api.readCurrentPage(doc);

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
          failedStep = deletion.failedStep;
          detail = deletion.detail || null;
          break;
        }

        const removed = () => {
          const gone = deletion.rows.filter((row) => !row.isConnected);
          const clearedPage = deletion.rows.length > 0 && gone.length === deletion.rows.length;
          return { gone, clearedPage };
        };
        let effect = removed();
        if (!effect.clearedPage) {
          note(options, 'Czekam');
          await pause(options, PAUSE_MS);
          throwIfAborted(options);
          effect = removed();
          if (!effect.clearedPage) {
            outcome = 'unchanged';
            failedStep = 'Czekam';
            break;
          }
        }
        const counted = done;
        done += effect.gone.length;
        if (done !== counted && typeof options.onProgress === 'function') {
          options.onProgress({
            done,
            failed,
            total: initialTotal ?? done,
            stopped: false,
            page,
          });
        }
        note(options, 'Czekam');
        await pause(options, PAUSE_MS);
        throwIfAborted(options);
        if (api.readFileTotal(doc) === 0) {
          outcome = 'done';
          break;
        }

        const method = await forceRefresh(doc, options, page);
        if (!method) {
          outcome = 'blocked';
          failedStep = 'Odświeżam';
          break;
        }
        refresh = method;
      }
    } catch (error) {
      if (options.signal?.aborted || error?.name === 'AbortError') stopped = true;
      else throw error;
    }

    if (!stopped && outcome === 'done' && api.readFileTotal(doc) > 0) {
      outcome = done === 0 ? 'blocked' : 'header';
    }

    return { done, failed, total: initialTotal ?? done, stopped, outcome, failedStep, detail, refresh };
  };
})(globalThis);
