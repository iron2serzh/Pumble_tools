export function mountFilesPage(document, count, options = {}) {
  const counts = options.pages || [count];
  const total = counts.reduce((sum, value) => sum + value, 0);
  let pageIndex = 0;

  document.body.replaceChildren();
  document.body.dataset.selectAllClicks = '0';
  document.body.dataset.trashClicks = '0';
  document.body.dataset.downloadClicks = '0';
  document.body.dataset.rowMenuClicks = '0';
  document.body.dataset.nextPageClicks = '0';
  document.body.dataset.ariaNextClicks = '0';
  document.body.dataset.decoyConfirmClicks = '0';

  const header = document.createElement('div');
  header.className = 'main-view-header file-browser-header-wrapper';
  const title = document.createElement('div');
  title.className = 'main-view-header__title';
  const titleText = document.createElement('div');
  titleText.textContent = ` Files (${total})`;
  title.appendChild(titleText);
  header.appendChild(title);

  const browser = document.createElement('div');
  browser.className = 'file-browser';
  const actions = document.createElement('span');
  actions.className = 'header-actions__actions';
  const headerActions = document.createElement('div');
  headerActions.className = 'header-actions';
  headerActions.appendChild(actions);

  const checkbox = document.createElement('div');
  checkbox.className = 'pmbl-checkbox header-actions__checkbox';
  const checkboxInput = document.createElement('input');
  checkboxInput.type = 'checkbox';
  const checkboxSpan = document.createElement('span');
  checkboxSpan.appendChild(checkboxInput);
  const checkboxInner = document.createElement('div');
  checkboxInner.appendChild(checkboxSpan);
  checkbox.appendChild(checkboxInner);
  actions.appendChild(checkbox);
  checkboxInput.addEventListener('click', () => {
    bump(document, 'selectAllClicks');
    showDeleteButton(document, actions, options);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'file-browser__wrapper';
  const list = document.createElement('div');
  list.className = 'file-browser__list';
  const pagination = document.createElement('div');
  pagination.className = 'file-browser__pagination';
  const nav = document.createElement('nav');
  const pages = document.createElement('ul');
  const previous = document.createElement('li');
  const previousButton = document.createElement('button');
  previousButton.type = 'button';
  previousButton.disabled = true;
  previous.appendChild(previousButton);
  const next = document.createElement('li');
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.addEventListener('click', () => {
    bump(document, 'nextPageClicks');
    if (options.next === 'stuck' || nextButton.disabled) return;
    if (pageIndex >= counts.length - 1) return;
    pageIndex += 1;
    renderPage();
  });
  next.appendChild(nextButton);
  const decoy = document.createElement('button');
  decoy.type = 'button';
  decoy.setAttribute('aria-label', 'Next page');
  decoy.addEventListener('click', () => bump(document, 'ariaNextClicks'));
  nav.appendChild(pages);
  pagination.append(decoy, nav);
  wrapper.append(list, pagination);
  browser.append(headerActions, wrapper);
  document.body.append(header, browser);

  renderPage();

  function renderPage() {
    list.replaceChildren();
    actions.querySelectorAll(':scope > div:not(.header-actions__checkbox)').forEach((node) => node.remove());
    const pageCount = counts[pageIndex] || 0;
    for (let index = 0; index < pageCount; index += 1) {
      list.appendChild(createRow(document, `${pageIndex}-${index}`));
    }
    pages.replaceChildren(previous);
    for (let number = 1; number <= counts.length; number += 1) {
      const item = document.createElement('li');
      item.textContent = String(number);
      if (number === pageIndex + 1) item.setAttribute('aria-current', 'page');
      pages.appendChild(document.createTextNode(''));
      pages.appendChild(item);
    }
    pages.appendChild(document.createTextNode(''));
    pages.appendChild(next);
    const canGoForward = pageIndex < counts.length - 1 && (options.next === 'reliable' || options.next === 'stuck');
    nextButton.disabled = !canGoForward;
  }
}

function showDeleteButton(document, actions, options) {
  actions.querySelectorAll(':scope > div:not(.header-actions__checkbox)').forEach((node) => node.remove());
  for (let index = 0; index < 3; index += 1) {
    const filler = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = index === 0 ? 'download' : 'other';
    button.addEventListener('click', () => {
      if (button.dataset.action === 'download') bump(document, 'downloadClicks');
    });
    filler.appendChild(button);
    actions.appendChild(filler);
  }
  const wrap = document.createElement('div');
  wrap.dataset.role = 'delete-wrap';
  const button = document.createElement('button');
  button.type = 'button';
  button.addEventListener('click', () => {
    bump(document, 'trashClicks');
    const rows = [...document.querySelectorAll('.file-browser__list > .file-list-view')];
    if (options.confirm === false) {
      rows.forEach((row) => row.remove());
      return;
    }
    openConfirm(document, rows);
  });
  wrap.appendChild(button);
  actions.appendChild(wrap);
}

function createRow(document, id) {
  const row = document.createElement('div');
  row.className = 'file-row file-list-view';
  row.dataset.fileId = id;
  const box = document.createElement('input');
  box.type = 'checkbox';
  row.appendChild(box);
  return row;
}

function openConfirm(document, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-dialog__transition-wrapper';
  const footer = document.createElement('div');
  footer.className = 'modal-dialog__footer modal-dialog__footer--hasFooterSeparator';
  const decoy = document.createElement('button');
  decoy.type = 'button';
  decoy.className = 'MuiButton-containedPrimary css-dr4g1b';
  decoy.addEventListener('click', () => bump(document, 'decoyConfirmClicks'));
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'MuiButton-containedPrimary css-dr4g1b confirmation-modal__confirm-btn';
  confirm.addEventListener('click', () => {
    rows.forEach((row) => row.remove());
    wrap.remove();
  });
  footer.append(decoy, confirm);
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.appendChild(footer);
  wrap.appendChild(dialog);
  document.body.appendChild(wrap);
}

function bump(document, name) {
  document.body.dataset[name] = String(Number(document.body.dataset[name] || 0) + 1);
}

export function clock(step = 50) {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms = step) => {
      time += ms;
    },
  };
}
