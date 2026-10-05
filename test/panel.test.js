import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExtension } from './helpers.js';
import { clock, mountFilesPage } from './pumble-page.js';

const scripts = ['src/list-files.js', 'src/wait-for.js', 'src/delete-session.js', 'src/panel.js'];

test('fileCountLabel uses Polish plural forms', () => {
  const { api } = loadExtension('<!doctype html><body></body>', scripts);
  assert.equal(api.fileCountLabel(1), '1 plik');
  assert.equal(api.fileCountLabel(2), '2 pliki');
  assert.equal(api.fileCountLabel(4), '4 pliki');
  assert.equal(api.fileCountLabel(5), '5 plików');
  assert.equal(api.fileCountLabel(12), '12 plików');
  assert.equal(api.fileCountLabel(22), '22 pliki');
});

test('syncPanel shows the current page count only on the Files view', () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);

  api.syncPanel(document);
  assert.equal(document.getElementById('pumble-tools-file-deleter'), null);

  mountFilesPage(document, 2);
  api.syncPanel(document);
  const panel = document.getElementById('pumble-tools-file-deleter');
  assert.ok(panel);
  assert.match(panel.textContent, /Pliki: 2/);
  assert.match(panel.textContent, /strona 1/);
  assert.equal(document.querySelectorAll('.file-browser__list > .file-row').length, 2);
});

test('asking to delete shows a confirmation and keeps the files', () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2);
  const panel = api.syncPanel(document);
  const button = panel.querySelector('.pumble-tools-delete');
  assert.ok(button);
  button.click();
  assert.match(panel.textContent, /Usunąć 2 pliki/);
  assert.match(panel.textContent, /Zaznaczę wszystko/);
  assert.match(panel.textContent, /ostatniej/);
  assert.equal(document.querySelectorAll('.file-browser__list > .file-row').length, 2);
});

test('cancelling the confirmation keeps every file', () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2);
  const panel = api.syncPanel(document);
  panel.querySelector('.pumble-tools-delete').click();
  const cancel = panel.querySelector('.pumble-tools-no');
  assert.ok(cancel);
  cancel.click();
  assert.equal(panel.querySelector('.pumble-tools-confirm').hidden, true);
  assert.equal(document.querySelectorAll('.file-browser__list > .file-row').length, 2);
});

test('confirming deletion removes the listed files and shows progress', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  const time = clock();
  const original = api.deleteListedFiles;
  api.deleteListedFiles = (doc, options) => original(doc, { ...options, ...time, timeoutMs: 200 });
  mountFilesPage(document, 2);
  const panel = api.syncPanel(document);
  panel.querySelector('.pumble-tools-delete').click();
  const yes = panel.querySelector('.pumble-tools-yes');
  assert.ok(yes);
  yes.click();
  await panel.pumbleDeletion;
  assert.equal(document.querySelectorAll('.file-browser__list > .file-row').length, 0);
  assert.match(panel.querySelector('.pumble-tools-status').textContent, /Usunięto 2 z 2/);
});

test('the panel shows a moving wait while a pause is in progress', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2);
  const original = api.deleteListedFiles;
  let sawWait = false;
  api.deleteListedFiles = (doc, options) => original(doc, {
    ...options,
    sleep: async () => {
      const bar = document.querySelector('.pumble-tools-wait');
      const step = document.querySelector('.pumble-tools-status').textContent;
      if (bar && bar.hidden === false && /Zaznaczam|Klikam kosz|Potwierdzam|Czekam|Strona/.test(step)) {
        sawWait = true;
      }
    },
  });
  const panel = api.syncPanel(document);
  panel.querySelector('.pumble-tools-delete').click();
  panel.querySelector('.pumble-tools-yes').click();
  await panel.pumbleDeletion;
  assert.equal(sawWait, true);
  assert.equal(panel.querySelector('.pumble-tools-wait').hidden, true);
  assert.match(panel.querySelector('.pumble-tools-status').textContent, /Usunięto 2 z 2/);
});

test('a confirm that leaves the files up does not say the run is finished', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  const time = clock();
  const original = api.deleteListedFiles;
  api.deleteListedFiles = (doc, options) => original(doc, { ...options, ...time, timeoutMs: 200 });
  mountFilesPage(document, 2, { pages: [121, 40], keepRows: true });
  const panel = api.syncPanel(document);
  panel.querySelector('.pumble-tools-delete').click();
  panel.querySelector('.pumble-tools-yes').click();
  await panel.pumbleDeletion;
  const status = panel.querySelector('.pumble-tools-status').textContent;
  assert.match(status, /Nie doszło: Czekam/);
  assert.match(status, /Usunięto 0 z 161/);
  assert.equal(status.startsWith('Gotowe'), false);
  assert.equal(document.querySelectorAll('.file-row').length, 40);
});

test('Stop aborts deletion before the next page', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 5] });
  const original = api.deleteListedFiles;
  const time = clock();
  api.deleteListedFiles = (doc, options) => original(doc, {
    ...options,
    ...time,
    timeoutMs: 200,
    onProgress(snapshot) {
      options.onProgress(snapshot);
      if (snapshot.page === 2) document.querySelector('.pumble-tools-stop').click();
    },
  });
  const panel = api.syncPanel(document);
  panel.querySelector('.pumble-tools-delete').click();
  const stop = panel.querySelector('.pumble-tools-stop');
  assert.ok(stop);
  panel.querySelector('.pumble-tools-yes').click();
  await panel.pumbleDeletion;
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.equal(document.body.dataset.actionLog, 'page:2,delete');
  assert.match(panel.querySelector('.pumble-tools-status').textContent, /Zatrzymano/);
});

test('the delete button stays off when the page lists nothing', () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 0);
  const panel = api.syncPanel(document);
  const button = panel.querySelector('.pumble-tools-delete');
  assert.equal(button.disabled, true);
  button.disabled = false;
  button.click();
  assert.equal(panel.querySelector('.pumble-tools-confirm').hidden, true);
});

test('watchFilesView shows the panel when the Files list appears', async () => {
  const { document, window, api } = loadExtension('<!doctype html><body></body>', scripts);
  assert.equal(typeof api.watchFilesView, 'function');
  api.watchFilesView(document);
  mountFilesPage(document, 1);
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  const panel = document.getElementById('pumble-tools-file-deleter');
  assert.ok(panel);
  assert.match(panel.textContent, /Pliki: 1/);
  assert.match(panel.textContent, /strona 1/);
  document.querySelector('.file-browser').remove();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  assert.equal(document.getElementById('pumble-tools-file-deleter'), null);
});

test('content script starts watching the page it is injected into', async () => {
  const { document, window } = loadExtension('<!doctype html><body></body>', [
    ...scripts,
    'src/content.js',
  ]);
  mountFilesPage(document, 1);
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  const panel = document.getElementById('pumble-tools-file-deleter');
  assert.ok(panel);
  assert.match(panel.textContent, /Pliki: 1/);
  assert.match(panel.textContent, /strona 1/);
});
