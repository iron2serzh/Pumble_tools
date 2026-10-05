(function (root) {
  root.PumbleFileDeleter = root.PumbleFileDeleter || {};

  root.PumbleFileDeleter.listFileRows = function listFileRows(doc) {
    const browser = doc.querySelector('.file-browser');
    if (!browser) return [];
    return [...browser.querySelectorAll('.file-list-view, .file-grid-view')];
  };
})(globalThis);
