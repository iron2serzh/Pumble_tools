(function (root) {
  const doc = root.document;
  if (!doc || !doc.documentElement || !root.PumbleFileDeleter) return;
  root.PumbleFileDeleter.watchFilesView(doc);
})(globalThis);
