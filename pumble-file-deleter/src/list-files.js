(function (root) {
  root.PumbleFileDeleter = root.PumbleFileDeleter || {};

  root.PumbleFileDeleter.listFileRows = function listFileRows(doc) {
    const browser = doc.querySelector('.file-browser');
    if (!browser) return [];
    return [...browser.querySelectorAll('.file-list-view, .file-grid-view')];
  };

  root.PumbleFileDeleter.readFileTotal = function readFileTotal(doc) {
    const title = doc.querySelector('.main-view-header.file-browser-header-wrapper .main-view-header__title');
    if (!title) return null;
    const match = (title.textContent || '').match(/\((\d+)\)/);
    return match ? Number(match[1]) : null;
  };

  function isCurrentPage(node) {
    const value = node.getAttribute?.('aria-current');
    return value === 'page' || value === 'true';
  }

  root.PumbleFileDeleter.readCurrentPage = function readCurrentPage(doc) {
    const ul = doc.querySelector('.file-browser .file-browser__pagination nav > ul');
    if (!ul) return 1;
    const nodes = [...ul.childNodes].filter((node) => node.nodeType === 1);
    const current = nodes.find((node) => isCurrentPage(node) || [...node.querySelectorAll('[aria-current]')].some(isCurrentPage));
    const value = Number((current?.textContent || '').trim());
    return Number.isFinite(value) && value > 0 ? value : 1;
  };
})(globalThis);
