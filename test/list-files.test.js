import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExtension } from './helpers.js';

test('listFileRows counts list and grid file cards inside the Files browser', () => {
  const { document, api } = loadExtension(`<!doctype html><body>
    <div class="file-browser">
      <div class="file-browser__list">
        <div class="file-list-view"></div>
        <div class="file-list-view"></div>
        <div class="skeleton-file-item-list"></div>
      </div>
      <div class="file-browser__grid">
        <div class="file-grid-view"></div>
      </div>
    </div>
    <div class="file-list-view"></div>
    <div class="file-row"><div class="file-options"></div></div>
  </body>`, ['src/list-files.js']);

  assert.equal(api.listFileRows(document).length, 3);
});

test('readFileTotal and readCurrentPage use the Files header and the marked page', () => {
  const { document, api } = loadExtension(`<!doctype html><body>
    <div class="main-view-header file-browser-header-wrapper">
      <div class="main-view-header__title"><div> Files (250)</div></div>
    </div>
    <div class="file-browser">
      <div class="file-browser__pagination">
        <nav><ul>
          <li><button type="button"></button></li>
          <li>1</li>
          <li aria-current="page">2</li>
          <li><button type="button"></button></li>
        </ul></nav>
      </div>
    </div>
  </body>`, ['src/list-files.js']);

  assert.equal(api.readFileTotal(document), 250);
  assert.equal(api.readCurrentPage(document), 2);
});
