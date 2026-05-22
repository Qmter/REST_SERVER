// Админ панель - скрипт
const usersTableBody = document.getElementById("usersTableBody");
const workspacesTableBody = document.getElementById("workspacesTableBody");
const logsTableBody = document.getElementById("logsTableBody");
const logExecutionsTableBody = document.getElementById("logExecutionsTableBody");
const jsonModal = document.getElementById("jsonModal");
const jsonModalContent = document.getElementById("jsonModalContent");
const jsonModalTitle = document.getElementById("jsonModalTitle");

// Маппинг ролей
const ROLE_NAMES = {
  1: "admin",
  2: "tester"
};

function getToken() {
  return localStorage.getItem("token");
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    let data = null;
    if (response.status !== 204) {
      const text = await response.text();
      if (text) {
        try { data = JSON.parse(text); } catch (_) {}
      }
    }

    if (response.status === 401) {
      const message = data?.detail || "Сессия истекла, войдите заново";
      clearAuth();
      throw new Error(message);
    }

    if (!response.ok) {
      const err = new Error(data?.detail || `Ошибка ${response.status}`);
      throw err;
    }

    return data;
  } catch (err) {
    if (err.message.includes("Failed to fetch")) {
      throw new Error("Нет соединения с сервером");
    }
    throw err;
  }
}

function clearAuth() {
  localStorage.removeItem("token");
}

function logout() {
  clearAuth();
  window.location.href = "login.html";
}

async function ensureAdminAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return false;
  }

  try {
    const me = await api("/users/me");
    if (me?.username) {
      const el = document.getElementById("sidebarUserName");
      if(el) el.textContent = me.username;
    }
    if (me?.id_role !== 1) {
      new Notify({
        status: 'error',
        title: 'Доступ запрещён',
        text: 'Требуется роль администратора',
        effect: 'fade',
        speed: 300,
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: 4000,
        type: 'outline',
        position: 'right top'
      });
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  } catch (_) {
    window.location.href = "login.html";
    return false;
  }
}

let statisticsStatusChart = null;
let statisticsObjectsChart = null;

async function openTab(tabName) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active"));

  const activeTab = document.getElementById(tabName);
  if (activeTab) {
    activeTab.classList.add("active");
  }

  if(tabName === 'users') loadUsers();
  if(tabName === 'workspaces') loadWorkspaces();
  if(tabName === 'statistics') loadStatistics();
  if(tabName === 'logs') loadLogs();
  if(tabName === 'log-executions') loadLogExecutions();
}

async function loadStatistics() {
  const totalTestsEl = document.getElementById("statTotalTests");
  const totalScenariosEl = document.getElementById("statTotalScenarios");
  const totalExecutionsEl = document.getElementById("statTotalExecutions");
  const passedFailedText = document.getElementById("statPassedFailedText");
  const statusCanvas = document.getElementById("statusChart");
  const objectsCanvas = document.getElementById("objectsChart");

  if (totalTestsEl) totalTestsEl.textContent = "Загрузка...";
  if (totalScenariosEl) totalScenariosEl.textContent = "Загрузка...";
  if (totalExecutionsEl) totalExecutionsEl.textContent = "Загрузка...";
  if (passedFailedText) passedFailedText.textContent = "Загрузка...";

  try {
    const stats = await api("/admin/statistics");

    const totalTests = stats.total_tests ?? 0;
    const totalScenarios = stats.total_scenarios ?? 0;
    const totalExecutions = stats.total_test_executions ?? 0;
    const passedTests = stats.passed_tests ?? 0;
    const failedTests = stats.failed_tests ?? 0;

    if (totalTestsEl) totalTestsEl.textContent = totalTests;
    if (totalScenariosEl) totalScenariosEl.textContent = totalScenarios;
    if (totalExecutionsEl) totalExecutionsEl.textContent = totalExecutions;
    if (passedFailedText) passedFailedText.textContent = `${passedTests} / ${failedTests}`;

    if (window.Chart) {
      if (statisticsStatusChart) statisticsStatusChart.destroy();
      if (statisticsObjectsChart) statisticsObjectsChart.destroy();

      if (statusCanvas) {
        statisticsStatusChart = new Chart(statusCanvas, {
          type: "doughnut",
          data: {
            labels: ["Пройдено", "Не пройдено"],
            datasets: [{
              data: [passedTests, failedTests],
              backgroundColor: ["#22c55e", "#ef4444"],
              borderColor: ["#111827", "#111827"],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: "#f8fafc" }
              },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.label}: ${ctx.parsed} (${Math.round(ctx.raw / Math.max(1, passedTests + failedTests) * 100)}%)`
                }
              }
            }
          }
        });
      }

      if (objectsCanvas) {
        statisticsObjectsChart = new Chart(objectsCanvas, {
          type: "bar",
          data: {
            labels: ["Тесты", "Сценарии", "Выполнения"],
            datasets: [{
              label: "Количество",
              data: [totalTests, totalScenarios, totalExecutions],
              backgroundColor: ["#3b82f6", "#f59e0b", "#10b981"],
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: "#f8fafc" }, grid: { display: false } },
              y: { ticks: { color: "#f8fafc" }, grid: { color: "rgba(148,163,184,0.2)" }, beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}` } }
            }
          }
        });
      }
    }
  } catch (err) {
    if (totalTestsEl) totalTestsEl.textContent = "-";
    if (totalScenariosEl) totalScenariosEl.textContent = "-";
    if (totalExecutionsEl) totalExecutionsEl.textContent = "-";
    if (passedFailedText) passedFailedText.textContent = "-";

    new Notify({
      status: "error",
      title: "Ошибка статистики",
      text: err.message,
      effect: "fade",
      speed: 300,
      showIcon: true,
      showCloseButton: true,
      autoclose: false,
      autotimeout: 0,
      type: "outline",
      position: "right top"
    });
  }
}

async function loadUsers() {
  if (!usersTableBody) return;
  usersTableBody.innerHTML = '<tr><td colspan="6" class="muted">Загрузка...</td></tr>'; // Исправлено colspan

  try {
    const users = await api("/admin/users");
    usersTableBody.innerHTML = "";

    if (!users || !users.length) {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="muted">Нет пользователей</td></tr>'; // Исправлено colspan
      return;
    }

    users.forEach(user => {
      const row = document.createElement("tr");
      const roleName = ROLE_NAMES[user.id_role] || `Role ${user.id_role}`;
      const createdAt = user.created_at ? new Date(user.created_at).toLocaleString("ru-RU") : "-";

      // Кнопка редактирования
      const editBtn = `
        <button type="button" class="tab-btn"
            style="color: #3b82f6; border-color: #3b82f6; padding: 4px 8px; font-size: 12px; margin-right: 5px;"
            onclick="openEditUserModal(${user.id_user}, '${escapeHtml(user.username).replace(/\'/g, "\\\'")}', '${escapeHtml(user.email || "").replace(/\'/g, "\\\'")}', ${user.id_role})"
            title="Редактировать пользователя">
            Редактировать
        </button>
      `;

      // Кнопка удаления
      const deleteBtn = `
        <button type="button" class="tab-btn"
            style="color: #ef4444; border-color: #ef4444; padding: 4px 8px; font-size: 12px;"
            onclick="openDeleteUserModal(${user.id_user}, '${escapeHtml(user.username).replace(/\'/g, "\\\'")}')"
            title="Удалить пользователя">
            Удалить
        </button>
      `;

      row.innerHTML = `
        <td>${user.id_user}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email || "-")}</td>
        <td><span class="pill">${escapeHtml(roleName)}</span></td>
        <td>${createdAt}</td>
        <td>${editBtn}${deleteBtn}</td>
      `;
      usersTableBody.appendChild(row);
    });
  } catch (err) {
    usersTableBody.innerHTML = `<tr><td colspan="6" class="muted" style="color:red;">${escapeHtml(err.message)}</td></tr>`;
    new Notify({
      status: 'error',
      title: 'Ошибка',
      text: err.message,
      effect: 'fade',
      speed: 300,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 5000,
      type: 'outline',
      position: 'right top'
    });
  }
}

async function loadWorkspaces() {
  if (!workspacesTableBody) return;
  workspacesTableBody.innerHTML = '<tr><td colspan="4" class="muted">Загрузка...</td></tr>';

  try {
    const workspaces = await api("/admin/workspaces");
    workspacesTableBody.innerHTML = "";

    if (!workspaces || !workspaces.length) {
      workspacesTableBody.innerHTML = '<tr><td colspan="4" class="muted">Нет воркспейсов</td></tr>';
      return;
    }

    workspaces.forEach(ws => {
      const row = document.createElement("tr");
      const createdAt = ws.created_at ? new Date(ws.created_at).toLocaleString("ru-RU") : "-";

      row.innerHTML = `
        <td>${ws.id_workspace}</td>
        <td>${escapeHtml(ws.name_workspace)}</td>
        <td>${escapeHtml(ws.description || "-")}</td>
        <td>${createdAt}</td>
      `;
      workspacesTableBody.appendChild(row);
    });
  } catch (err) {
    workspacesTableBody.innerHTML = `<tr><td colspan="4" class="muted" style="color:red;">${escapeHtml(err.message)}</td></tr>`;
    new Notify({
      status: 'error',
      title: 'Ошибка',
      text: err.message,
      effect: 'fade',
      speed: 300,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 5000,
      type: 'outline',
      position: 'right top'
    });
  }
}

async function loadLogs() {
  if (!logsTableBody) return;
  const limit = document.getElementById("logsLimit")?.value || 100;
  logsTableBody.innerHTML = '<tr><td colspan="5" class="muted">Загрузка...</td></tr>';

  try {
    const logs = await api(`/admin/logs?limit=${limit}&offset=0`);
    logsTableBody.innerHTML = "";

    if (!logs || !logs.length) {
      logsTableBody.innerHTML = '<tr><td colspan="5" class="muted">Нет логов</td></tr>';
      return;
    }

    logs.forEach(log => {
      const row = document.createElement("tr");
      const logDate = log.log_date ? new Date(log.log_date).toLocaleString("ru-RU") : "-";
      const objectType = log.object_type || "-";
      const action = log.action || "-";
      const objectId = log.object_id !== null ? log.object_id : "-";

      let detailsBtn = "";
      if (log.old_value || log.new_value) {
        // Для системных логов передаем тип 'system'
        const detailData = {
            type: 'system',
            old_value: log.old_value,
            new_value: log.new_value
        };
        const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(detailData))));
        detailsBtn = `<button type="button" class="tab-btn" onclick="showJsonDecoded('${encodedData}')">Посмотреть</button>`;
      } else {
        detailsBtn = '<span class="muted">-</span>';
      }

      row.innerHTML = `
        <td>${log.id_log}</td>
        <td>${escapeHtml(objectType)} #${objectId}</td>
        <td><span class="pill">${escapeHtml(action)}</span></td>
        <td>${logDate}</td>
        <td>${detailsBtn}</td>
      `;
      logsTableBody.appendChild(row);
    });
  } catch (err) {
    logsTableBody.innerHTML = `<tr><td colspan="5" class="muted" style="color:red;">${escapeHtml(err.message)}</td></tr>`;
    new Notify({
      status: 'error',
      title: 'Ошибка',
      text: err.message,
      effect: 'fade',
      speed: 300,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 5000,
      type: 'outline',
      position: 'right top'
    });
  }
}

async function loadLogExecutions() {
  if (!logExecutionsTableBody) return;
  const limit = document.getElementById("logExecutionsLimit")?.value || 100;
  logExecutionsTableBody.innerHTML = '<tr><td colspan="4" class="muted">Загрузка...</td></tr>';

  try {
    const logExecs = await api(`/admin/log-executions?limit=${limit}&offset=0`);
    logExecutionsTableBody.innerHTML = "";

    if (!logExecs || !logExecs.length) {
      logExecutionsTableBody.innerHTML = '<tr><td colspan="4" class="muted">Нет записей</td></tr>';
      return;
    }

    logExecs.forEach(log => {
      const row = document.createElement("tr");
      const createdAt = log.created_at ? new Date(log.created_at).toLocaleString("ru-RU") : "-";

      let detailsBtn = "";
      if (log.detail) {
        // Для логов выполнений передаем тип 'execution' и сырой detail
        const detailData = {
            type: 'execution',
            detail: log.detail
        };
        const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(detailData))));
        detailsBtn = `<button type="button" class="tab-btn" onclick="showJsonDecoded('${encodedData}')">Посмотреть</button>`;
      } else {
        detailsBtn = '<span class="muted">-</span>';
      }

      row.innerHTML = `
        <td>${log.id_log_exec}</td>
        <td>${log.id_test_execution}</td>
        <td>${createdAt}</td>
        <td>${detailsBtn}</td>
      `;
      logExecutionsTableBody.appendChild(row);
    });
  } catch (err) {
    logExecutionsTableBody.innerHTML = `<tr><td colspan="4" class="muted" style="color:red;">${escapeHtml(err.message)}</td></tr>`;
    new Notify({
      status: 'error',
      title: 'Ошибка',
      text: err.message,
      effect: 'fade',
      speed: 300,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 5000,
      type: 'outline',
      position: 'right top'
    });
  }
}

// --- ФУНКЦИИ ПАРСИНГА ЛОГОВ (КОПИЯ ИЗ APP.JS) ---

function normalizeLogText(text) {
  if (!text) return "";
  return String(text).replace(/\r\n/g, "\n").replace(/\t/g, "  ");
}

function parseLogChunks(logText) {
  const chunks = [];
  const lines = normalizeLogText(logText).split("\n");

  const isDivider = (line) => /^[-=]{8,}$/.test(line.trim());
  const isMarker = (line) => {
    const value = line.trim();
    return isDivider(value)
      || value.startsWith("TEST:")
      || value.startsWith("step.")
      || value === "PRESET-TEST"
      || value === "AFTER-TEST"
      || value.startsWith("Request URL:")
      || value === "Request body:"
      || value === "Response:"
      || value.startsWith("An error occurred:");
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line || isDivider(line)) continue;

    if (line.startsWith("TEST:")) {
      chunks.push({ type: "test", text: line.replace(/^TEST:\s*/, "") });
      continue;
    }

    if (line.startsWith("step.")) {
      chunks.push({ type: "step", text: line });
      continue;
    }

    if (line === "PRESET-TEST" || line === "AFTER-TEST") {
      chunks.push({ type: "phase", text: line });
      continue;
    }

    if (line.startsWith("Request URL:")) {
      chunks.push({ type: "request", text: line.replace(/^Request URL:\s*/, "") });
      continue;
    }

    if (line === "Request body:" || line === "Response:") {
      const block = [];
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (!next.trim()) {
          i += 1;
          break;
        }
        if (isMarker(next)) break;
        block.push(next);
        i += 1;
      }
      chunks.push({
        type: line === "Request body:" ? "body" : "response",
        text: block.join("\n").trim()
      });
      continue;
    }

    if (line.startsWith("An error occurred:")) {
      chunks.push({ type: "error", text: line.replace(/^An error occurred:\s*/, "") });
      continue;
    }

    chunks.push({ type: "line", text: raw });
  }

  return chunks;
}

function renderLog(container, log) {
  if (!container) return;
  const logText = normalizeLogText(log);
  container.innerHTML = "";
  container.classList.remove("code-block");
  container.classList.add("log-view");

  if (!logText.trim()) {
    const empty = document.createElement("div");
    empty.className = "log-empty";
    empty.textContent = "Лог пустой";
    container.appendChild(empty);
    return;
  }

  const chunks = parseLogChunks(logText);
  let currentCard = null;

  const appendToCurrent = (node) => {
    if (!currentCard) {
      currentCard = document.createElement("section");
      currentCard.className = "log-card";
      container.appendChild(currentCard);
    }
    currentCard.appendChild(node);
  };

  chunks.forEach((chunk) => {
    if (chunk.type === "test" || chunk.type === "phase") {
      currentCard = document.createElement("section");
      currentCard.className = "log-card";
      const title = document.createElement("div");
      title.className = "log-title";
      title.textContent = chunk.type === "phase" ? chunk.text : `TEST: ${chunk.text}`;
      currentCard.appendChild(title);
      container.appendChild(currentCard);
      return;
    }

    if (chunk.type === "step") {
      const step = document.createElement("div");
      step.className = "log-step";
      step.textContent = chunk.text;
      appendToCurrent(step);
      return;
    }

    if (chunk.type === "request") {
      const row = document.createElement("div");
      row.className = "log-request";
      const label = document.createElement("span");
      label.className = "log-label";
      label.textContent = "URL";
      const value = document.createElement("span");
      value.className = "log-url";
      value.textContent = chunk.text;
      row.append(label, value);
      appendToCurrent(row);
      return;
    }

    if (chunk.type === "body" || chunk.type === "response") {
      const blockWrap = document.createElement("div");
      blockWrap.className = `log-json-wrap ${chunk.type === "response" ? "is-response" : "is-body"}`;
      const label = document.createElement("div");
      label.className = "log-block-label";
      label.textContent = chunk.type === "response" ? "Response" : "Request body";
      const pre = document.createElement("pre");
      pre.className = "log-json";
      let contentText = chunk.text || "empty";
      try {
        if (contentText.trim().startsWith('{') || contentText.trim().startsWith('[')) {
            const jsonObj = JSON.parse(contentText);
            pre.textContent = JSON.stringify(jsonObj, null, 2);
        } else {
            pre.textContent = contentText;
        }
      } catch (e) {
        pre.textContent = contentText;
      }

      blockWrap.append(label, pre);
      appendToCurrent(blockWrap);
      return;
    }

    if (chunk.type === "error") {
      const error = document.createElement("div");
      error.className = "log-error";
      error.textContent = chunk.text;
      appendToCurrent(error);
      return;
    }

    const line = document.createElement("div");
    line.className = "log-line";
    line.textContent = chunk.text;
    appendToCurrent(line);
  });
}

// Подсветка синтаксиса JSON (для обычных полей)
function syntaxHighlight(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
    json = escapeHtml(json);
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// Парсер значений для системных логов
function parseLogValue(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'string') {
                try { return JSON.parse(parsed); } catch (e) { return parsed; }
            }
            return parsed;
        } catch (e) {
            return val;
        }
    }
    return val;
}

// ГЛАВНАЯ ФУНКЦИЯ ОТРИСОВКИ МОДАЛКИ
function renderJsonModalContent(data) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "20px";

    // 1. ОБРАБОТКА ЛОГОВ ВЫПОЛНЕНИЯ (EXECUTION LOGS)
    if (data.type === 'execution' && data.detail) {
        let logContent = null;

        // Пробуем распарсить detail как JSON строку
        try {
            const parsedDetail = JSON.parse(data.detail);
            // Если внутри есть поле 'log', это наш текст
            if (parsedDetail.log) {
                logContent = parsedDetail.log;
            } else {
                // Если поля log нет, но есть другой контент, показываем как JSON
                logContent = JSON.stringify(parsedDetail, null, 2);
            }
        } catch (e) {
            // Если не JSON, показываем как есть
            logContent = data.detail;
        }

        if (logContent) {
            const wrapper = document.createElement("div");
            wrapper.className = "log-entry-block";
            wrapper.style.marginBottom = "0";

            const label = document.createElement("strong");
            label.className = "log-key-label";
            label.textContent = "LOG EXECUTION:";
            label.style.display = "block";
            label.style.marginBottom = "10px";

            const logContainer = document.createElement("div");
            logContainer.className = "log-view";

            wrapper.appendChild(label);
            wrapper.appendChild(logContainer);
            container.appendChild(wrapper);

            // Рендерим красивый лог
            renderLog(logContainer, logContent);
        }
        return container.innerHTML;
    }

    // 2. ОБРАБОТКА СИСТЕМНЫХ ЛОГОВ (SYSTEM LOGS)
    if (data.type === 'system') {
        const fields = [
            { key: 'old_value', label: 'OLD VALUE' },
            { key: 'new_value', label: 'NEW VALUE' }
        ];

        fields.forEach(field => {
            const val = data[field.key];
            if (val === null && field.key === 'old_value') {
                 // Можно пропустить или показать null
            }

            const block = document.createElement("div");
            block.className = "log-entry-block";

            const label = document.createElement("strong");
            label.className = "log-key-label";
            label.textContent = field.label + ":";
            block.appendChild(label);

            const parsed = parseLogValue(val);

            if (parsed === null) {
                const span = document.createElement("span");
                span.className = "null";
                span.textContent = "null";
                block.appendChild(span);
            } else if (typeof parsed === 'string') {
                const pre = document.createElement("pre");
                pre.className = "log-json"; // Используем стиль логов для текста
                pre.style.whiteSpace = "pre-wrap";
                pre.textContent = parsed;
                block.appendChild(pre);
            } else {
                const pre = document.createElement("pre");
                pre.className = "log-json";
                pre.textContent = JSON.stringify(parsed, null, 2);
                block.appendChild(pre);
            }

            container.appendChild(block);
        });
        return container.innerHTML;
    }

    // Fallback для неизвестных типов
    const div = document.createElement("div");
    div.textContent = "Неизвестный формат данных";
    div.style.color = "red";
    container.appendChild(div);
    return container.innerHTML;
}

function showJsonDecoded(encodedString) {
    if (!jsonModal || !jsonModalContent) return;

    try {
        const jsonString = decodeURIComponent(escape(atob(encodedString)));
        const data = JSON.parse(jsonString);

        // Очищаем и рендерим
        jsonModalContent.innerHTML = renderJsonModalContent(data);

        if(jsonModalTitle) {
            jsonModalTitle.textContent = data.type === 'execution' ? "Лог выполнения" : "Детали записи";
        }

        jsonModal.style.display = "flex";
        jsonModal.classList.add("active");

        const modalContainer = jsonModal.querySelector('.modal');
        if(modalContainer) {
            modalContainer.classList.add('modal-large');
        }

    } catch (e) {
        console.error(e);
        new Notify({
            status: 'error',
            title: 'Ошибка отображения',
            text: e.message,
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 5000,
            type: 'outline',
            position: 'right top'
        });
        jsonModalContent.innerHTML = `<div style="color:red; padding:20px;">Ошибка чтения данных: ${e.message}</div>`;
        jsonModal.style.display = "flex";
        jsonModal.classList.add("active");
    }
}

function closeJsonModal() {
    if (jsonModal) {
        jsonModal.style.display = "none";
        jsonModal.classList.remove("active");
        if(jsonModalContent) jsonModalContent.innerHTML = '';
    }
}

function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

// --- ФУНКЦИИ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ ---

function openCreateUserModal() {
    const modal = document.getElementById("createUserModal");
    if(modal) {
        modal.style.display = "flex";
        modal.classList.add("active");
        // Сброс формы
        document.getElementById("createUserForm").reset();
    }
}

function closeCreateUserModal() {
    const modal = document.getElementById("createUserModal");
    if(modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
    }
}

async function handleCreateUser(event) {
    event.preventDefault();

    const btn = document.getElementById("createUserSubmitBtn");
    const prevText = btn.textContent;

    const username = document.getElementById("newUsername").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("newPassword").value;
    const role = parseInt(document.getElementById("newRole").value);

    if(!username || !email || !password) {
        new Notify({
            status: 'warning',
            title: 'Внимание',
            text: 'Заполните все обязательные поля',
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 4000,
            type: 'outline',
            position: 'right top'
        });
        return;
    }

    // Блокируем кнопку
    btn.disabled = true;
    btn.textContent = "Создание...";

    try {
        await api("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                username,
                email,
                password,
                id_role: role
            })
        });

        new Notify({
            status: 'success',
            title: 'Успешно',
            text: `Пользователь ${username} создан`,
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 3000,
            type: 'outline',
            position: 'right top'
        });

        closeCreateUserModal();
        loadUsers(); // Обновляем таблицу

    } catch (err) {
        new Notify({
            status: 'error',
            title: 'Ошибка создания',
            text: err.message,
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: false, // Не закрывать автоматически, чтобы прочитать ошибку
            autotimeout: 0,
            type: 'outline',
            position: 'right top'
        });
    } finally {
        btn.disabled = false;
        btn.textContent = prevText;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof API_BASE === 'undefined') {
        console.error("API_BASE не найден!");
        new Notify({
            status: 'error',
            title: 'Конфигурация',
            text: "API_BASE не найден. Проверьте подключение скриптов.",
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: false,
            autotimeout: 0,
            type: 'outline',
            position: 'right top'
        });
        return;
    }

    const isAuth = await ensureAdminAuth();
    if (!isAuth) return;

    loadUsers();

    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
        const savedTheme = localStorage.getItem("theme") || "dark";
        themeSelect.value = savedTheme;
        document.body.className = `theme-${savedTheme}`;

        themeSelect.addEventListener("change", (e) => {
            const theme = e.target.value;
            document.body.className = `theme-${theme}`;
            localStorage.setItem("theme", theme);
        });
    }

    window.addEventListener("click", (e) => {
        // Закрытие модальных окон при клике вне их
        if (e.target === jsonModal) {
            closeJsonModal();
        }
        if (e.target === document.getElementById("createUserModal")) {
            closeCreateUserModal();
        }
    });
});

// --- ФУНКЦИИ УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ ---

let userIdToDelete = null;

function openDeleteUserModal(userId, username) {
    userIdToDelete = userId;
    const nameDisplay = document.getElementById("deleteUserNameDisplay");
    if(nameDisplay) nameDisplay.textContent = username;

    const modal = document.getElementById("deleteUserModal");
    if(modal) {
        modal.style.display = "flex";
        modal.classList.add("active");
    }
}

function closeDeleteUserModal() {
    userIdToDelete = null;
    const modal = document.getElementById("deleteUserModal");
    if(modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
    }
}

async function confirmDeleteUser() {
    if (!userIdToDelete) return;

    const btn = document.getElementById("confirmDeleteBtn");
    const prevText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Удаление...";

    try {
        // Предполагается, что у вас есть эндпоинт DELETE /admin/users/{id}
        // Если эндпоинт другой, измените путь ниже
        await api(`/admin/users/${userIdToDelete}`, {
            method: "DELETE"
        });

        new Notify({
            status: 'success',
            title: 'Успешно',
            text: 'Пользователь удален',
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 3000,
            type: 'outline',
            position: 'right top'
        });

        closeDeleteUserModal();
        loadUsers(); // Обновляем таблицу

    } catch (err) {
        new Notify({
            status: 'error',
            title: 'Ошибка удаления',
            text: err.message,
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: false,
            autotimeout: 0,
            type: 'outline',
            position: 'right top'
        });
    } finally {
        btn.disabled = false;
        btn.textContent = prevText;
    }
}

// Обработчик для кнопки подтверждения внутри модалки
const confirmBtn = document.getElementById("confirmDeleteBtn");
if(confirmBtn) {
    confirmBtn.onclick = confirmDeleteUser;
}
// --- ФУНКЦИИ РЕДАКТИРОВАНИЯ ПОЛЬЗОВАТЕЛЯ ---

let currentEditUserId = null;

function openEditUserModal(userId, username, email, roleId) {
    currentEditUserId = userId;

    document.getElementById("editUserId").value = userId;
    document.getElementById("editUsername").value = username;
    document.getElementById("editEmail").value = email || "";
    document.getElementById("editPassword").value = "";
    document.getElementById("editRole").value = roleId.toString();

    const modal = document.getElementById("editUserModal");
    if(modal) {
        modal.style.display = "flex";
        modal.classList.add("active");
    }
}

function closeEditUserModal() {
    currentEditUserId = null;
    const modal = document.getElementById("editUserModal");
    if(modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
    }
}

async function handleEditUser(event) {
    event.preventDefault();

    const btn = document.getElementById("editUserSubmitBtn");
    const prevText = btn.textContent;

    const userId = parseInt(document.getElementById("editUserId").value);
    const username = document.getElementById("editUsername").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const password = document.getElementById("editPassword").value;
    const role = parseInt(document.getElementById("editRole").value);

    if(!username || !email) {
        new Notify({
            status: 'warning',
            title: 'Внимание',
            text: 'Заполните все обязательные поля',
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 4000,
            type: 'outline',
            position: 'right top'
        });
        return;
    }

    // Блокируем кнопку
    btn.disabled = true;
    btn.textContent = "Сохранение...";

    try {
        const updateData = {
            username: username,
            email: email,
            id_role: role
        };

        // Добавляем пароль только если он был введен
        if(password && password.length > 0) {
            updateData.password = password;
        }

        await api(`/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify(updateData)
        });

        new Notify({
            status: 'success',
            title: 'Успешно',
            text: `Пользователь ${username} обновлен`,
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: true,
            autotimeout: 3000,
            type: 'outline',
            position: 'right top'
        });

        closeEditUserModal();
        loadUsers(); // Обновляем таблицу

    } catch (err) {
        new Notify({
            status: 'error',
            title: 'Ошибка обновления',
            text: err.message,
            effect: 'fade',
            speed: 300,
            showIcon: true,
            showCloseButton: true,
            autoclose: false,
            autotimeout: 0,
            type: 'outline',
            position: 'right top'
        });
    } finally {
        btn.disabled = false;
        btn.textContent = prevText;
    }
}

// Обработчик клика вне модального окна редактирования
document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("editUserModal")) {
            closeEditUserModal();
        }
    });
});