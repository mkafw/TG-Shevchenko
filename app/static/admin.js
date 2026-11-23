const tg = window.Telegram?.WebApp;

const state = {
  summary: null,
};

const els = {
  notice: document.querySelector("#notice"),
  refreshDashboard: document.querySelector("#refreshDashboard"),
  totalUsers: document.querySelector("#totalUsers"),
  totalBooks: document.querySelector("#totalBooks"),
  totalBonuses: document.querySelector("#totalBonuses"),
  totalProgress: document.querySelector("#totalProgress"),
  messageAudience: document.querySelector("#messageAudience"),
  messageUser: document.querySelector("#messageUser"),
  messageText: document.querySelector("#messageText"),
  sendMessage: document.querySelector("#sendMessage"),
  messageResult: document.querySelector("#messageResult"),
  progressList: document.querySelector("#progressList"),
  booksList: document.querySelector("#booksList"),
  usersList: document.querySelector("#usersList"),
};

function authHeaders() {
  if (tg?.initData) {
    return { Authorization: `Bearer ${tg.initData}` };
  }
  return {};
}

async function api(path, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function readError(response) {
  try {
    const data = await response.json();
    return data.detail || JSON.stringify(data);
  } catch (error) {
    return response.text();
  }
}

function setupTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

async function loadDashboard() {
  setNotice(tg?.initData ? "" : "Telegram initData 为空。请向机器人发送 /start 并点击管理后台按钮打开面板。");
  els.refreshDashboard.disabled = true;
  try {
    state.summary = await api("/admin/api/summary");
    renderDashboard();
  } finally {
    els.refreshDashboard.disabled = false;
  }
}

function renderDashboard() {
  const summary = state.summary;
  if (!summary) return;
  els.totalUsers.textContent = summary.stats.total_users;
  els.totalBooks.textContent = summary.stats.total_books;
  els.totalBonuses.textContent = summary.stats.total_welcome_bonuses;
  els.totalProgress.textContent = summary.stats.active_progress_rows;
  renderUserOptions(summary.users);
  renderProgress(summary.progress);
  renderBooks(summary.books);
  renderUsers(summary.users);
  syncMessageAudience();
}

function renderUserOptions(users) {
  els.messageUser.innerHTML = "";
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${userName(user)} · ${user.telegram_id}`;
    els.messageUser.append(option);
  });
}

function renderProgress(rows) {
  renderList(els.progressList, rows, (row) => {
    const item = createRow();
    item.append(
      createMain(`${userName(row)} 正在阅读 ${cleanTitle(row.book_title)}`, `${row.current_page}/${row.total_chunks}`),
      createMeta([
        `TG ${row.telegram_id}`,
        row.book_author ? `作者: ${row.book_author}` : "",
        row.last_opened_at ? `上次打开: ${formatDate(row.last_opened_at)}` : "",
      ]),
      createProgress(row.progress_percent),
    );
    return item;
  });
}

function renderBooks(rows) {
  renderList(els.booksList, rows, (row) => {
    const item = createRow();
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const rechunkButton = document.createElement("button");
    rechunkButton.className = "small-action-button";
    rechunkButton.type = "button";
    rechunkButton.textContent = "重新分段";
    rechunkButton.addEventListener("click", () => rechunkBook(row, rechunkButton));
    actions.append(rechunkButton);
    item.append(
      createMain(cleanTitle(row.title), row.source_type.toUpperCase()),
      createMeta([
        `上传者: ${userName({
          display_name: row.owner_display_name,
          username: row.owner_username,
          telegram_id: row.owner_telegram_id,
        })}`,
        `TG ${row.owner_telegram_id}`,
        `${row.total_chunks} 个分段`,
        `${row.total_words} 字`,
        formatDate(row.uploaded_at),
      ]),
      actions,
    );
    return item;
  });
}

function renderUsers(rows) {
  renderList(els.usersList, rows, (row) => {
    const item = createRow();
    item.append(
      createMain(userName(row), `ID ${row.id}`),
      createMeta([`TG ${row.telegram_id}`, row.username ? `@${row.username}` : "", `注册时间: ${formatDate(row.created_at)}`]),
      createStats([`${row.books_added} 本书`, `${row.welcome_bonuses_used} 次前情提要`]),
    );
    return item;
  });
}

function renderList(container, rows, renderRow) {
  container.innerHTML = "";
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "暂无数据";
    container.append(empty);
    return;
  }
  rows.forEach((row) => container.append(renderRow(row)));
}

function createRow() {
  const item = document.createElement("article");
  item.className = "data-row";
  return item;
}

function createMain(title, pillText) {
  const main = document.createElement("div");
  main.className = "row-main";
  const titleNode = document.createElement("div");
  titleNode.className = "row-title";
  titleNode.textContent = title;
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = pillText;
  main.append(titleNode, pill);
  return main;
}

function createMeta(values) {
  const meta = document.createElement("div");
  meta.className = "row-meta";
  values.filter(Boolean).forEach((value) => {
    const span = document.createElement("span");
    span.textContent = value;
    meta.append(span);
  });
  return meta;
}

function createStats(values) {
  const stats = document.createElement("div");
  stats.className = "row-stats";
  values.forEach((value) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = value;
    stats.append(pill);
  });
  return stats;
}

function createProgress(percent) {
  const track = document.createElement("div");
  track.className = "progress-track";
  const fill = document.createElement("span");
  fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  track.append(fill);
  return track;
}

async function sendMessage() {
  const text = els.messageText.value.trim();
  if (!text) {
    setMessageResult("消息内容不能为空。");
    return;
  }

  const audience = els.messageAudience.value === "all" ? "all" : "user";
  const userId = Number(els.messageUser.value);
  const targetLabel = audience === "all" ? "所有用户" : selectedUserLabel();
  if (!window.confirm(`确定要向 ${targetLabel} 发送消息吗？`)) return;

  els.sendMessage.disabled = true;
  setMessageResult("正在发送...");
  try {
    const result = await api("/admin/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        user_id: audience === "user" ? userId : null,
        text,
      }),
    });
    setMessageResult(formatMessageResult(result));
    if (result.sent > 0) els.messageText.value = "";
  } catch (error) {
    setMessageResult(error.message);
  } finally {
    els.sendMessage.disabled = false;
  }
}

async function rechunkBook(row, button) {
  const title = cleanTitle(row.title);
  if (!window.confirm(`确定重新分段书籍《${title}》吗？读者的阅读进度将根据在文本中的字数位置自动顺延。`)) {
    return;
  }

  button.disabled = true;
  button.textContent = "分段中...";
  setNotice("");
  try {
    const result = await api(`/admin/api/books/${row.id}/rechunk`, { method: "POST" });
    setMessageResult(
      `分段完成：《${title}》原为 ${result.old_total_chunks} 段，现为 ${result.new_total_chunks} 段；已同步 ${result.progress_rows_updated} 位读者的阅读进度。`,
    );
    await loadDashboard();
  } catch (error) {
    setNotice(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "重新分段";
  }
}

function formatMessageResult(result) {
  const failures = result.results.filter((item) => !item.ok);
  if (!failures.length) return `发送成功：${result.sent} 条，无错误。`;
  return `发送完成：成功 ${result.sent} 条，失败 ${result.failed} 条。${failures
    .slice(0, 3)
    .map((item) => `${item.telegram_id}: ${item.error}`)
    .join(" | ")}`;
}

function syncMessageAudience() {
  const isAll = els.messageAudience.value === "all";
  els.messageUser.disabled = isAll;
}

function selectedUserLabel() {
  const option = els.messageUser.selectedOptions[0];
  return option ? option.textContent : "选中的用户";
}

function userName(user) {
  return user.display_name || (user.username ? `@${user.username}` : `TG ${user.telegram_id}`);
}

function cleanTitle(title) {
  return String(title || "未命名书籍").replace(/\.(txt|epub|fb2|zip)$/i, "");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function setNotice(message) {
  els.notice.textContent = message;
  els.notice.classList.toggle("hidden", !message);
}

function setMessageResult(message) {
  els.messageResult.textContent = message;
  els.messageResult.classList.toggle("hidden", !message);
}

function bindEvents() {
  els.refreshDashboard.addEventListener("click", () => loadDashboard().catch((error) => setNotice(error.message)));
  els.messageAudience.addEventListener("change", syncMessageAudience);
  els.sendMessage.addEventListener("click", () => sendMessage());
}

async function init() {
  setupTelegram();
  bindEvents();
  await loadDashboard();
}

init().catch((error) => setNotice(error.message));
