import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionDir = path.join(root, 'pumble-file-deleter');

const scriptNames = [
  'src/list-files.js',
  'src/wait-for.js',
  'src/delete-session.js',
  'src/panel.js',
];

export function loadExtension(html = '<!doctype html><html><body></body></html>', scripts = scriptNames) {
  const dom = new JSDOM(html, { url: 'https://app.pumble.com/files', runScripts: 'outside-only' });
  for (const name of scripts) {
    const file = path.join(extensionDir, name);
    const source = fs.readFileSync(file, 'utf8');
    dom.window.eval(source);
  }
  return { window: dom.window, document: dom.window.document, api: dom.window.PumbleFileDeleter };
}
