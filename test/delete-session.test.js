import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExtension } from './helpers.js';
import { clock, mountFilesPage } from './pumble-page.js';

const scripts = ['src/list-files.js', 'src/wait-for.js', 'src/delete-session.js'];

function run(document, api, extra = {}) {
  const time = clock();
  return api.deleteListedFiles(document, { ...time, timeoutMs: 200, ...extra });
}

function logOf(document) {
  return document.body.dataset.actionLog.split(',').filter(Boolean);
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
  assert.equal(document.body.dataset.nextPageClicks, '0');
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
  assert.equal(document.body.dataset.nextPageClicks, '0');
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

test('deleteListedFiles stops before the earlier page when aborted', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 5] });
  const controller = new AbortController();

  const result = await run(document, api, {
    signal: controller.signal,
    onProgress(progress) {
      if (progress.page === 2) controller.abort();
    },
  });

  assert.equal(result.done, 5);
  assert.equal(result.stopped, true);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.deepEqual(logOf(document), ['page:2', 'delete']);
});

test('deleteListedFiles starts on the last page number and deletes backward', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3, 1] });

  const result = await run(document, api);
  const log = logOf(document);

  assert.equal(result.done, 6);
  assert.equal(result.failed, 0);
  assert.equal(log[0], 'page:3');
  assert.deepEqual(log.filter((entry) => entry === 'delete'), ['delete', 'delete', 'delete']);
  assert.equal(log.includes('next'), false);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(document.body.dataset.downloadClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '3');
  assert.equal(document.body.dataset.trashClicks, '3');
  assert.equal(document.querySelectorAll('.file-row').length, 0);
});

test('deleteListedFiles clears seven pages from the last page number back to page 1', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  const pages = [40, 40, 40, 40, 40, 40, 10];
  mountFilesPage(document, 40, { pages });
  const pager = document.querySelector('.file-browser .file-browser__pagination nav > ul');
  assert.equal(pager.textContent, '1234567');
  assert.equal(pager.childNodes[0].querySelector('button').type, 'button');
  assert.equal(pager.childNodes[pager.childNodes.length - 1].querySelector('button').type, 'button');

  const result = await run(document, api);

  assert.equal(result.done, 250);
  assert.equal(result.failed, 0);
  assert.equal(api.readFileTotal(document), 250);
  assert.equal(logOf(document)[0], 'page:7');
  assert.equal(logOf(document).includes('next'), false);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '7');
  assert.equal(document.querySelectorAll('.file-row').length, 0);
});

test('deleteListedFiles does not walk forward when the next arrow is enabled', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3] });

  const result = await run(document, api);

  assert.equal(result.done, 5);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(logOf(document)[0], 'page:2');
});

test('deleteListedFiles stops when the previous page does not change the list', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3], back: 'stuck' });

  const result = await run(document, api);

  assert.equal(result.done, 3);
  assert.equal(result.stopped, false);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.equal(logOf(document)[0], 'page:2');
  assert.equal(logOf(document).includes('next'), false);
});

test('deleteListedFiles reports progress from the last page back to the first', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 1] });
  const progress = [];

  await run(document, api, {
    onProgress(snapshot) {
      progress.push({ ...snapshot });
    },
  });

  assert.deepEqual(progress, [
    { done: 1, failed: 0, total: 3, stopped: false, page: 2 },
    { done: 3, failed: 0, total: 3, stopped: false, page: 1 },
  ]);
});
