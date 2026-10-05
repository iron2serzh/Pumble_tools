import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExtension } from './helpers.js';
import { clock, mountFilesPage } from './pumble-page.js';

const scripts = ['src/list-files.js', 'src/wait-for.js', 'src/delete-session.js'];

function run(document, api, extra = {}) {
  const time = clock();
  const sleeps = [];
  const phases = [];
  return api.deleteListedFiles(document, {
    ...time,
    timeoutMs: 200,
    sleep: async (ms) => {
      sleeps.push(ms);
      await time.sleep(ms);
    },
    onPhase(phase) {
      phases.push(phase);
    },
    ...extra,
  }).then((result) => ({ ...result, sleeps, phases }));
}

function logOf(document) {
  return document.body.dataset.actionLog.split(',').filter(Boolean);
}

function waited(result) {
  return result.sleeps.reduce((sum, ms) => sum + ms, 0);
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
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(document.body.dataset.decoyConfirmClicks, '0');
  assert.equal(api.readFileTotal(document), 0);
  assert.ok(waited(result) >= 1000);
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
  assert.equal(document.body.dataset.prevPageClicks, '0');
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

test('deleteListedFiles stops before the next delete when aborted', async () => {
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
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.deepEqual(logOf(document), ['page:2', 'delete']);
});

test('deleteListedFiles aborts during a page-switch pause before any delete', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 5] });
  const controller = new AbortController();

  const result = await run(document, api, {
    signal: controller.signal,
    sleep: async () => {
      controller.abort();
    },
  });

  assert.equal(result.done, 0);
  assert.equal(result.stopped, true);
  assert.equal(document.body.dataset.selectAllClicks, '0');
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.equal(logOf(document)[0], 'page:2');
});

test('deleteListedFiles aborts during the post-delete wait before the next delete', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 5] });
  const controller = new AbortController();

  const result = await run(document, api, {
    signal: controller.signal,
    sleep: async () => {
      if (document.body.dataset.trashClicks === '1') controller.abort();
    },
  });

  assert.equal(result.done, 5);
  assert.equal(result.stopped, true);
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.deepEqual(logOf(document), ['page:2', 'delete']);
});

test('deleteListedFiles returns to page 1 after each delete and then opens the new max', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3, 1] });

  const result = await run(document, api);
  const log = logOf(document);

  assert.equal(result.done, 6);
  assert.equal(result.failed, 0);
  assert.deepEqual(log, ['page:3', 'delete', 'page:1', 'page:2', 'delete', 'page:1', 'delete']);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.equal(document.body.dataset.ariaNextClicks, '0');
  assert.equal(document.body.dataset.downloadClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '3');
  assert.equal(api.readFileTotal(document), 0);
  assert.ok(waited(result) >= 7000);
  assert.ok(result.phases.filter((phase) => phase === 'wait').length >= 7);
});

test('deleteListedFiles clears seven pages by re-reading the max from page 1', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  const pages = [40, 40, 40, 40, 40, 40, 10];
  mountFilesPage(document, 40, { pages });
  const pager = document.querySelector('.file-browser .file-browser__pagination nav > ul');
  assert.equal(pager.textContent, '1234567');
  assert.equal(pager.childNodes[0].querySelector('button').type, 'button');
  assert.equal(pager.childNodes[pager.childNodes.length - 1].querySelector('button').type, 'button');

  const result = await run(document, api);
  const log = logOf(document);

  assert.equal(result.done, 250);
  assert.equal(result.failed, 0);
  assert.equal(api.readFileTotal(document), 0);
  assert.equal(log[0], 'page:7');
  assert.equal(log.includes('next'), false);
  assert.equal(log.includes('prev'), false);
  assert.equal(log.filter((entry) => entry === 'page:1').length, 6);
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.equal(document.body.dataset.selectAllClicks, '7');
  assert.ok(waited(result) >= 19000);
});

test('deleteListedFiles still deletes every page when the pager does not mark the current one', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 40, { pages: [40, 40, 40, 41], markCurrent: false });

  const result = await run(document, api);

  assert.equal(api.readCurrentPage(document), 1);
  assert.equal(result.done, 161);
  assert.equal(result.outcome, 'done');
  assert.equal(result.stopped, false);
  assert.equal(document.body.dataset.selectAllClicks, '4');
  assert.equal(document.body.dataset.prevPageClicks, '0');
  assert.equal(document.body.dataset.nextPageClicks, '0');
  assert.equal(api.readFileTotal(document), 0);
});

test('deleteListedFiles keeps deleting when the header total is slow to change', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 40, { pages: [40, 40, 41], freezeHeader: true });

  const result = await run(document, api);

  assert.equal(result.done, 121);
  assert.equal(result.outcome, 'header');
  assert.equal(document.body.dataset.selectAllClicks, '3');
  assert.equal(api.readFileTotal(document), 121);
  assert.equal(document.querySelectorAll('.file-row').length, 0);
});

test('deleteListedFiles stops only after a confirm click leaves the files in place', async () => {
  const { document, api } = loadExtension('<!doctype html><body></body>', scripts);
  mountFilesPage(document, 2, { pages: [2, 3], keepRows: true });

  const result = await run(document, api);

  assert.equal(result.done, 0);
  assert.equal(result.outcome, 'unchanged');
  assert.equal(result.stopped, false);
  assert.equal(document.body.dataset.selectAllClicks, '1');
  assert.equal(document.body.dataset.trashClicks, '1');
  assert.equal(api.readFileTotal(document), 5);
  assert.equal(document.querySelectorAll('.file-row').length, 3);
});

test('deleteListedFiles reports progress from the max page back toward page 1', async () => {
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
