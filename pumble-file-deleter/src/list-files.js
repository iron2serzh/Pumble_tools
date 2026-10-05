(function (root) {
  root.PumbleFileDeleter = root.PumbleFileDeleter || {};

  root.PumbleFileDeleter.listFileRows = function listFileRows(doc) {
    const list = doc.querySelector('.file-browser .file-browser__list');
    if (!list) return [];
    return [...list.children].filter((row) => row.querySelector(':scope > .file-options, :scope .file-options'));
  };
})(globalThis);
