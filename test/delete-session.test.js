import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExtension } from './helpers.js';
import { clock, mountFilesPage } from './pumble-page.js';

const scripts = ['src/list-files.js', 'src/wait-for.js', 'src/delete-session.js'];

function run(document, api, extra = {}) {
  const time = clock();
  return api.deleteListedFiles(document, { ...time, timeoutMs: 200, ...extra });
}

test('deleteListedFiles selects the whole page once and clicks the selection trash', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 40);

  const result = await run(document, api);

  assert.equal(result.done, 40);
  assert.equal(result.failed, 0);
  assert.equal(result.stopped, false);
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.equal(document.body.dataset.trashClicks, '1');
  assert.equal(document.body.dataset.downloadClicks, '0');
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(document.body.dataset.decoyConfirmClicks, '0');
  assert.equal(api.readFileTotal(document), 40);
  assert.equal(document.querySelectorAll('.file-browser__list > .file-row').length, 0);
});

test('deleteListedFiles still clears the page when Pumble shows no confirm dialog', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { confirm: false });

  const result = await run(document, api);

  assert.equal(result.done, 2);
  assert.equal(result.failed, 0);
  assert.equal(document.body.dataset.trashClicks, '1');
  assert.equal(document.querySelectorAll('.file-row').length, 0);
});

test('deleteListedFiles confirms with confirmation-modal__confirm-btn', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 1);

  const result = await run(document, api);

  assert.equal(result.done, 1);
  assert.equal(result.failed, 0);
  assert.equal(document.body.dataset.decoyConfirmClicks, '0');
  assert.equal(document.querySelectorAll('.file-row').length, 0);
});

test('deleteListedFiles stops before the next page when aborted', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3], next: 'reliable' });
  const controller = new AbortController();

  const result = await run(document, api, {
    signal: controller.signal,
    onProgress(progress) {
      if (progress.page === 1) controller.abort();
    },
  });

  assert.equal(result.done, 2);
  assert.equal(result.stopped, true);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '1');
});

test('deleteListedFiles repeats on the next page when that control is explicit', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3], next: 'reliable' });

  const result = await run(document, api);

  assert.equal(result.done, 5);
  assert.equal(result.failed, 0);
  assert.equal(document.body.dataset.selectAllClicks, '2');
  assert.equal(document.body.dataset.trashClicks, '2');
  assert.equal(document.body.dataset.nextPageClicks, '1');
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(document.body.dataset.downloadClicks, '0');
  assert.equal(document.querySelectorAll('.file-row').length, 0);
});

test('deleteListedFiles ignores a pagination button that is not a next-page control', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3] });

  const result = await run(document, api);

  assert.equal(result.done, 2);
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '1');
});

test('deleteListedFiles stops when Next page does not change the list', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3], next: 'stuck' });

  const result = await run(document, api);

  assert.equal(result.done, 2);
  assert.equal(result.stopped, false);
  assert.equal(document.body.dataset.nextPageClicks, '1');
  assert.equal(document.body.dataset.selectAllClicks, '1');
});

test('deleteListedFiles reports progress once per page', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 1], next: 'reliable' });
  const progress = [];

  await run(document, api, {
    onProgress(snapshot) {
      progress.push({ ...snapshot });
    },
  });

  assert.deepEqual(progress, [
    { done: 2, failed: 0, total: 3, stopped: false, page: 1 },
    { done: 3, failed: 0, total: 3, stopped: false, page: 2 },
  ]);
});
