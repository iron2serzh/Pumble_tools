export function mountFilesPage(document, count, options = {}) {
  const counts = options.pages ? [...options.pages] : [count];
  let pageIndex = 0;
  let stale = false;
  let lost = false;
  let staleLabels = [];
  let staleCurrent = 1;
  let visit = 0;

  document.body.replaceChildren();
  document.body.dataset.selectAllClicks = '0';
  document.body.dataset.trashClicks = '0';
  document.body.dataset.downloadClicks = '0';
  document.body.dataset.rowMenuClicks = '0';
  document.body.dataset.nextPageClicks = '0';
  document.body.dataset.prevPageClicks = '0';
  document.body.dataset.pageNumberClicks = '0';
  document.body.dataset.ariaNextClicks = '0';
  document.body.dataset.decoyConfirmClicks = '0';
  document.body.dataset.filterDecoyClicks = '0';
  document.body.dataset.confirmClicks = '0';
  document.body.dataset.actionLog = '';

  const header = document.createElement('div');
  header.className = 'main-view-header file-browser-header-wrapper';
  const title = document.createElement('div');
  title.className = 'main-view-header__title';
  const titleText = document.createElement('div');
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
    if (!checkboxInput.checked) return;
    queueMicrotask(() => {
      showDeleteButton(document, actions, options, () => shrinkAfterDelete());
    });
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
  previousButton.addEventListener('click', () => {
    note('prev');
    bump(document, 'prevPageClicks');
    lost = true;
    stale = false;
    list.replaceChildren();
    pages.replaceChildren();
  });
  previous.appendChild(previousButton);
  const next = document.createElement('li');
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.addEventListener('click', () => {
    note('next');
    bump(document, 'nextPageClicks');
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

  updateHeader();
  renderPage();

  function note(action) {
    const current = document.body.dataset.actionLog;
    document.body.dataset.actionLog = current ? `${current},${action}` : action;
  }

  function updateHeader() {
    if (options.freezeCount || options.freezeHeader) return;
    const sum = counts.reduce((total, value) => total + value, 0);
    titleText.textContent = ` Files (${sum})`;
  }

  function renderLabels(labels, current) {
    pages.replaceChildren(previous);
    labels.forEach((number) => {
      const item = document.createElement('li');
      item.textContent = String(number);
      if (options.markCurrent !== false && number === current) item.setAttribute('aria-current', 'page');
      item.addEventListener('click', () => {
        note(`page:${number}`);
        bump(document, 'pageNumberClicks');
        if (lost) return;
        if (stale) {
          if (number !== 1) return;
          stale = false;
          pageIndex = 0;
          renderPage();
          return;
        }
        if (number < 1 || number > counts.length) return;
        pageIndex = number - 1;
        renderPage();
      });
      pages.appendChild(item);
    });
    pages.appendChild(next);
    previousButton.disabled = false;
    nextButton.disabled = false;
  }

  function renderPage() {
    list.replaceChildren();
    checkboxInput.checked = false;
    seedFilterDecoy(document, actions);
    if (lost) {
      pages.replaceChildren();
      return;
    }
    if (stale) {
      renderLabels(staleLabels, staleCurrent);
      return;
    }
    visit += 1;
    const pageCount = counts[pageIndex] || 0;
    for (let index = 0; index < pageCount; index += 1) {
      const id = options.freezeCount
        ? `${visit}-${pageIndex}-${index}`
        : `${pageIndex}-${index}`;
      list.appendChild(createRow(document, id));
    }
    const labels = [];
    for (let number = 1; number <= counts.length; number += 1) labels.push(number);
    renderLabels(labels, counts.length === 0 ? 0 : pageIndex + 1);
    updateHeader();
  }

  function shrinkAfterDelete() {
    if (!options.freezeCount) {
      if (counts.length > 0 && pageIndex === counts.length - 1) counts.pop();
      else if (pageIndex >= 0 && pageIndex < counts.length) counts[pageIndex] = 0;
      updateHeader();
    }
    staleLabels = [];
    const shown = options.freezeCount ? (options.pages || [count]).length : Math.max(counts.length + 1, 1);
    for (let number = 1; number <= shown; number += 1) staleLabels.push(number);
    staleCurrent = pageIndex + 1;
    stale = true;
    list.replaceChildren();
    renderLabels(staleLabels, staleCurrent);
  }

  if (options.freezeCount || options.freezeHeader) {
    const sum = (options.pages || [count]).reduce((total, value) => total + value, 0);
    titleText.textContent = ` Files (${sum})`;
  }
}

function seedFilterDecoy(document, actions) {
  actions.querySelectorAll(':scope > div:not(.header-actions__checkbox)').forEach((node) => node.remove());
  for (let index = 0; index < 3; index += 1) {
    const filler = document.createElement('div');
    actions.appendChild(filler);
  }
  const wrap = document.createElement('div');
  wrap.dataset.role = 'filter-decoy';
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.action = 'filter-decoy';
  button.addEventListener('click', () => bump(document, 'filterDecoyClicks'));
  wrap.appendChild(button);
  actions.appendChild(wrap);
}

function showDeleteButton(document, actions, options, onCleared) {
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
    const current = document.body.dataset.actionLog;
    document.body.dataset.actionLog = current ? `${current},delete` : 'delete';
    const rows = [...document.querySelectorAll('.file-browser__list > .file-list-view')];
    if (options.confirm === 'absent') return;
    if (options.confirm === false) {
      rows.forEach((row) => row.remove());
      onCleared();
      return;
    }
    openConfirm(document, rows, onCleared, options);
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

function openConfirm(document, rows, onCleared, options = {}) {
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
    bump(document, 'confirmClicks');
    wrap.remove();
    if (options.keepRows) return;
    rows.forEach((row) => row.remove());
    onCleared();
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
