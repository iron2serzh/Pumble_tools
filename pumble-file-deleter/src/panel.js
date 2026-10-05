(function (root) {
  root.PumbleFileDeleter = root.PumbleFileDeleter || {};

  function listedCount(doc) {
    const total = root.PumbleFileDeleter.readFileTotal(doc);
    if (total != null) return total;
    return root.PumbleFileDeleter.listFileRows(doc).length;
  }

  function renderCount(panel, doc) {
    const total = root.PumbleFileDeleter.readFileTotal(doc);
    const page = root.PumbleFileDeleter.readCurrentPage(doc);
    const rows = root.PumbleFileDeleter.listFileRows(doc).length;
    const label = total == null
      ? `Na tej stronie: ${rows}`
      : `Pliki: ${total} · strona ${page}`;
    const countNode = panel.querySelector('.pumble-tools-count');
    if (countNode.textContent !== label) countNode.textContent = label;
    const button = panel.querySelector('.pumble-tools-delete');
    if (button) button.disabled = rows === 0 || listedCount(doc) === 0 || panel.dataset.running === '1';
  }

  function ensurePanel(doc) {
    let panel = doc.getElementById('pumble-tools-file-deleter');
    if (panel) return panel;
    panel = doc.createElement('aside');
    panel.id = 'pumble-tools-file-deleter';
    panel.innerHTML = `
      <p class="pumble-tools-count"></p>
      <button type="button" class="pumble-tools-delete">Usuń widoczne</button>
      <button type="button" class="pumble-tools-stop" hidden>Stop</button>
      <div class="pumble-tools-confirm" hidden>
        <p class="pumble-tools-confirm-text"></p>
        <button type="button" class="pumble-tools-yes">Usuń</button>
        <button type="button" class="pumble-tools-no">Anuluj</button>
      </div>
      <div class="pumble-tools-wait" hidden><span class="pumble-tools-wait-bar"></span></div>
      <p class="pumble-tools-status"></p>
    `;
    panel.querySelector('.pumble-tools-delete').addEventListener('click', () => {
      const count = listedCount(doc);
      if (count === 0 || panel.dataset.running === '1') return;
      const confirm = panel.querySelector('.pumble-tools-confirm');
      confirm.hidden = false;
      panel.querySelector('.pumble-tools-confirm-text').textContent =
        `Usunąć ${root.PumbleFileDeleter.fileCountLabel(count)}? Zaznaczę wszystko i użyję kosza. Zaczynam od ostatniej strony, po każdym kasowaniu wracam na stronę 1.`;
    });
    panel.querySelector('.pumble-tools-no').addEventListener('click', () => {
      panel.querySelector('.pumble-tools-confirm').hidden = true;
    });
    let controller = null;
    panel.querySelector('.pumble-tools-stop').addEventListener('click', () => {
      controller?.abort();
    });
    panel.querySelector('.pumble-tools-yes').addEventListener('click', () => {
      panel.querySelector('.pumble-tools-confirm').hidden = true;
      const status = panel.querySelector('.pumble-tools-status');
      const stop = panel.querySelector('.pumble-tools-stop');
      controller = new AbortController();
      panel.dataset.running = '1';
      stop.hidden = false;
      const wait = panel.querySelector('.pumble-tools-wait');
      panel.pumbleDeletion = root.PumbleFileDeleter.deleteListedFiles(doc, {
        signal: controller.signal,
        onPhase(phase) {
          if (phase === 'wait') {
            wait.hidden = false;
            panel.classList.add('pumble-tools-waiting');
            if (status.textContent !== 'Czekam…') status.dataset.held = status.textContent;
            status.textContent = 'Czekam…';
          } else {
            wait.hidden = true;
            panel.classList.remove('pumble-tools-waiting');
            if (status.textContent === 'Czekam…') status.textContent = status.dataset.held || '';
          }
        },
        onProgress(snapshot) {
          const errors = snapshot.failed ? `, błędy: ${snapshot.failed}` : '';
          status.textContent = `Usunięto ${snapshot.done} z ${snapshot.total}${errors}`;
          status.dataset.held = status.textContent;
        },
      }).then((result) => {
        panel.dataset.running = '0';
        stop.hidden = true;
        const errors = result.failed ? `, błędy: ${result.failed}` : '';
        status.textContent = result.stopped
          ? `Zatrzymano. Usunięto ${result.done} z ${result.total}${errors}.`
          : `Gotowe. Usunięto ${result.done} z ${result.total}${errors}.`;
        renderCount(panel, doc);
        return result;
      });
    });
    doc.body.appendChild(panel);
    return panel;
  }

  root.PumbleFileDeleter.syncPanel = function syncPanel(doc) {
    const browser = doc.querySelector('.file-browser');
    const existing = doc.getElementById('pumble-tools-file-deleter');
    if (!browser) {
      existing?.remove();
      return null;
    }
    const panel = ensurePanel(doc);
    if (panel.dataset.running !== '1') renderCount(panel, doc);
    return panel;
  };

  root.PumbleFileDeleter.watchFilesView = function watchFilesView(doc) {
    const sync = () => root.PumbleFileDeleter.syncPanel(doc);
    const observer = new doc.defaultView.MutationObserver(sync);
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    sync();
    return observer;
  };

  root.PumbleFileDeleter.fileCountLabel = function fileCountLabel(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (count === 1) return '1 plik';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} pliki`;
    return `${count} plików`;
  };
})(globalThis);
