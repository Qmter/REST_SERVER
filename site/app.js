const API_BASE = localStorage.getItem("apiBase") || "http://localhost:8000";

const themeSelect = document.getElementById("themeSelect");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("error");
const sidebarUserName = document.getElementById("sidebarUserName");
const SIDEBAR_STATE_KEY = "sidebar_collapsed";

const workspaceListOwn = document.getElementById("workspaceListOwn");
const workspaceListShared = document.getElementById("workspaceListShared");
const workspaceForm = document.getElementById("workspaceForm");
const workspaceNameInput = document.getElementById("workspaceName");
const workspaceDescInput = document.getElementById("workspaceDesc");
const workspaceTitle = document.getElementById("workspaceTitle");
const workspaceDescription = document.getElementById("workspaceDescription");
const workspaceStats = document.getElementById("workspaceStats");
const backToProjects = document.getElementById("backToProjects");
const deleteWorkspaceBtn = document.getElementById("deleteWorkspaceBtn");
let deleteModal = document.getElementById("deleteModal");
let deleteModalConfirm = document.getElementById("deleteModalConfirm");
let deleteModalCancel = document.getElementById("deleteModalCancel");
let deleteModalText = document.getElementById("deleteModalText");
let infoModal = document.getElementById("infoModal");
let infoModalText = document.getElementById("infoModalText");
let infoModalClose = document.getElementById("infoModalClose");

function cacheDeleteModalElements() {
  deleteModal = document.getElementById("deleteModal");
  deleteModalConfirm = document.getElementById("deleteModalConfirm");
  deleteModalCancel = document.getElementById("deleteModalCancel");
  deleteModalText = document.getElementById("deleteModalText");
  infoModal = document.getElementById("infoModal");
  infoModalText = document.getElementById("infoModalText");
  infoModalClose = document.getElementById("infoModalClose");
}

const connectionForm = document.getElementById("connectionForm");
const connectionWorkspaceLabel = document.getElementById("connectionWorkspaceLabel");
const connectionBaseUrl = document.getElementById("connectionBaseUrl");
const connectionAuthType = document.getElementById("connectionAuthType");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authToken = document.getElementById("authToken");
const authApiKey = document.getElementById("authApiKey");
const connectionStatus = document.getElementById("connectionStatus");
const deleteConnectionBtn = document.getElementById("deleteConnection");
const connectionCurrent = document.getElementById("connectionCurrent");
const checkConnectionBtn = document.getElementById("checkConnectionBtn");
const connectionCompactToggle = document.getElementById("connectionCompactToggle");
const connectionSummary = document.getElementById("connectionSummary");
const membersList = document.getElementById("membersList");
const memberForm = document.getElementById("memberForm");
const memberUsername = document.getElementById("memberUsername");
const memberAccess = document.getElementById("memberAccess");
const memberStatus = document.getElementById("memberStatus");
const membersPanel = document.getElementById("membersPanel");
const membersSummary = document.getElementById("membersSummary");
const membersCompactToggle = document.getElementById("membersCompactToggle");
// create page elements
const createPageForm = document.getElementById("scenarioCreateForm");
const createPageName = document.getElementById("scenarioCreateName");
const createPageValidate = document.getElementById("scenarioCreateValidate");
const createPageSave = document.getElementById("scenarioCreateSave");
const createPageCancel = document.getElementById("scenarioCreateCancel");
const createPageFormat = document.getElementById("scenarioCreateFormat");
const createPageStatus = document.getElementById("scenarioCreateStatus");
const jsonEditorEl = document.getElementById("jsonEditor");
const scenarioList = document.getElementById("scenarioList");
const createScenarioBtn = document.getElementById("createScenarioBtn");
const connectionPanel = document.getElementById("connectionPanel");
const scenarioSearch = document.getElementById("scenarioSearch");
const scenarioSort = document.getElementById("scenarioSort");
const testList = document.getElementById("testList");
const testSearch = document.getElementById("testSearch");
const testSort = document.getElementById("testSort");
const generateTestsBtn = document.getElementById("generateTestsBtn");
const runAllTestsBtn = document.getElementById("runAllTestsBtn");
const workspaceLogHistoryBtn = document.getElementById("workspaceLogHistoryBtn");
const workspaceLogHistoryModal = document.getElementById("workspaceLogHistoryModal");
const workspaceLogHistoryList = document.getElementById("workspaceLogHistoryList");
const workspaceLogHistoryClose = document.getElementById("workspaceLogHistoryClose");
const testTitle = document.getElementById("testTitle");
const testMeta = document.getElementById("testMeta");
const testContent = document.getElementById("testContent");
const backToWorkspaceFromTest = document.getElementById("backToWorkspaceFromTest");
const runTestDetailBtn = document.getElementById("runTestDetailBtn");
const testRunStatus = document.getElementById("testRunStatus");
const testRunLogWrap = document.getElementById("testRunLogWrap");
const testRunLog = document.getElementById("testRunLog");
const toggleTestRunLogBtn = document.getElementById("toggleTestRunLogBtn");
const closeTestRunLogBtn = document.getElementById("closeTestRunLogBtn");
const executionsList = document.getElementById("executionsList");
const deleteAllTestLogsBtn = document.getElementById("deleteAllTestLogsBtn");
const logModal = document.getElementById("logModal");
const executionLogModal = document.getElementById("executionLogModal");
const logModalClose = document.getElementById("logModalClose");
const logDownloadBtn = document.getElementById("logDownloadBtn");
const openapiFile = document.getElementById("openapiFile");
const chooseOpenapiBtn = document.getElementById("chooseOpenapiBtn");
const uploadOpenapiBtn = document.getElementById("uploadOpenapiBtn");
const deleteOpenapiBtn = document.getElementById("deleteOpenapiBtn");
const openapiStatus = document.getElementById("openapiStatus");

let currentWorkspaceId = null;
let currentConnectionId = null;
let currentIsOwner = false;
let currentAccessType = null;
let currentExecutionLogId = null;
let scenarioCache = [];
let testsCache = [];
let connectionLastData = null;
let membersLast = [];
let activeRunsCache = [];
let activeRunsTimer = null;

if (connectionAuthType) {
  connectionAuthType.addEventListener("change", (e) => {
    const idAuthType = Number(e.target.value || 1);
    updateAuthVisibility(idAuthType);
  });
}

function getToken() {
  return localStorage.getItem("token");
}

function saveToken(token) {
  localStorage.setItem("token", token);
}

function clearAuth() {
  localStorage.removeItem("token");
}

function redirectToLogin() {
  window.location.href = "login.html";
}

function togglePanelCompact(panel, toggleBtn, forceValue) {
  if (!panel) return;
  const next = forceValue !== undefined ? forceValue : !panel.classList.contains("compact");
  panel.classList.toggle("compact", next);
  if (toggleBtn) {
    toggleBtn.textContent = next ? "Развернуть" : "Компактно";
  }
}

function updateConnectionSummary() {
  if (!connectionSummary) return;
  const base = connectionLastData?.base_url || "—";
  const auth = connectionLastData?.authSummary || "—";
  const openapi = openapiStatus?.textContent || "—";
  connectionSummary.innerHTML = `
    <div><strong>Base URL:</strong> ${base}</div>
    <div><strong>Auth:</strong> ${auth}</div>
    <div><strong>OpenAPI:</strong> ${openapi}</div>
  `;
}

function updateMembersSummary() {
  if (!membersSummary) return;
  const count = membersLast.length;
  const owners = membersLast.filter((m) => m.name_access_type === "owner").map((m) => m.username);
  membersSummary.innerHTML = count
    ? `
      <div><strong>Участников:</strong> ${count}</div>
      <div><strong>Owner:</strong> ${owners.join(", ") || "—"}</div>
    `
    : "<div class='muted'>Пока никого нет</div>";
}

function inferNotifyStatus(text) {
  const value = String(text || "").toLowerCase();
  if (
    value.startsWith("ошибка")
    || value.startsWith("не удалось")
    || value.startsWith("не передан")
    || value.startsWith("нет подключения")
    || value.startsWith("редактор не загрузился")
    || value.startsWith("только ")
    || value.startsWith("у вас нет прав")
    || value.startsWith("не найден")
    || value.startsWith("некоррект")
    || value.startsWith("неверный")
  ) {
    return "error";
  }
  if (
    value.startsWith("сохранено")
    || value.startsWith("обновлено")
    || value.startsWith("удалено")
    || value.startsWith("подключение установлено")
    || value.startsWith("тест сгенерирован")
    || value.startsWith("сгенерированы")
    || value.startsWith("все тесты запущены")
    || value.startsWith("все логи удалены")
  ) {
    return "success";
  }
  return "info";
}

function setButtonLoading(btn, isLoading, ariaLabel = "Выполняется") {
  if (!btn) return;
  if (isLoading) {
    if (!btn.dataset.idleText) btn.dataset.idleText = btn.textContent || "";
    btn.disabled = true;
    btn.textContent = "";
    btn.classList.add("is-loading");
    btn.setAttribute("aria-label", ariaLabel);
    btn.setAttribute("aria-busy", "true");
    return;
  }

  if (!btn.classList.contains("is-loading") && !btn.dataset.idleText) return;
  btn.disabled = false;
  btn.classList.remove("is-loading");
  btn.textContent = btn.dataset.idleText || "";
  btn.removeAttribute("aria-busy");
  btn.removeAttribute("aria-label");
  delete btn.dataset.idleText;
}

function getScenarioDraftKey(workspaceId, scenarioId = "new") {
  return `scenarioDraft:${workspaceId}:${scenarioId}`;
}

function saveScenarioDraft(workspaceId, scenarioId, draft) {
  if (!workspaceId) return;
  try {
    localStorage.setItem(getScenarioDraftKey(workspaceId, scenarioId), JSON.stringify({
      updated_at: new Date().toISOString(),
      ...draft
    }));
  } catch (err) {
    console.warn("Failed to save scenario draft", err);
  }
}

function loadScenarioDraft(workspaceId, scenarioId) {
  if (!workspaceId) return null;
  try {
    const raw = localStorage.getItem(getScenarioDraftKey(workspaceId, scenarioId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load scenario draft", err);
    return null;
  }
}

function clearScenarioDraft(workspaceId, scenarioId) {
  if (!workspaceId) return;
  localStorage.removeItem(getScenarioDraftKey(workspaceId, scenarioId));
}

function bindScenarioDraftAutosave(workspaceId, scenarioId, nameInput, editor, statusEl) {
  let saveTimer = null;

  const syncDraft = () => {
    const name = nameInput?.value || "";
    const content = editor?.getValue ? editor.getValue() : "";
    saveScenarioDraft(workspaceId, scenarioId, { name, content });
    if (statusEl) {
      statusEl.textContent = "Черновик сохранён локально";
      statusEl.classList.remove("error");
    }
  };

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(syncDraft, 350);
  };

  if (nameInput) {
    nameInput.addEventListener("input", scheduleSave);
  }

  if (editor?.on) {
    editor.on("change", scheduleSave);
  }

  window.addEventListener("beforeunload", syncDraft);

  return {
    flush: syncDraft,
    destroy: () => {
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener("beforeunload", syncDraft);
    }
  };
}

function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

function testHasActiveRun(testId) {
  const numericTestId = Number(testId);
  return activeRunsCache.some((run) => {
    if (run.type === "test") return Number(run.id_test) === numericTestId;
    if (run.type === "all_tests") return (run.test_ids || []).map(Number).includes(numericTestId);
    return false;
  });
}

function setStatusLoading(statusEl, isLoading) {
  if (!statusEl) return;
  if (isLoading) {
    statusEl.style.display = "inline-flex";
    statusEl.className = "badge-soft status-badge status-running is-loading";
    statusEl.textContent = "";
    statusEl.setAttribute("aria-label", "Выполняется запуск теста");
    statusEl.setAttribute("aria-busy", "true");
    return;
  }

  if (statusEl.classList.contains("is-loading")) {
    statusEl.style.display = "none";
    statusEl.className = "badge-soft";
    statusEl.textContent = "";
    statusEl.removeAttribute("aria-busy");
    statusEl.removeAttribute("aria-label");
  }
}

function applyActiveRunState() {
  const allTestsActive = activeRunsCache.some((run) => run.type === "all_tests");
  if (runAllTestsBtn) {
    setButtonLoading(runAllTestsBtn, allTestsActive, "Выполняется запуск всех тестов");
  }

  document.querySelectorAll("[data-run-test-id]").forEach((btn) => {
    setButtonLoading(btn, testHasActiveRun(btn.dataset.runTestId), "Выполняется запуск теста");
  });

  const params = new URLSearchParams(window.location.search);
  const pageTestId = Number(params.get("id"));
  if (runTestDetailBtn && pageTestId) {
    setButtonLoading(runTestDetailBtn, testHasActiveRun(pageTestId), "Выполняется запуск теста");
    setStatusLoading(testRunStatus, testHasActiveRun(pageTestId));
  }
}

async function refreshActiveRuns(workspaceId) {
  if (!workspaceId) return;
  try {
    activeRunsCache = await api(`/tests/${workspaceId}/runs/active`);
    applyActiveRunState();
  } catch (err) {
    console.warn("Failed to refresh active runs", err);
  }
}

function startActiveRunsPolling(workspaceId) {
  if (!workspaceId) return;
  if (activeRunsTimer) clearInterval(activeRunsTimer);
  refreshActiveRuns(workspaceId);
  activeRunsTimer = setInterval(() => refreshActiveRuns(workspaceId), 2000);
}

function renderWorkspaceStats() {
  if (!workspaceStats) return;

  const scenarioCount = scenarioCache.length;
  const testCount = testsCache.length;
  const scenarioIdsWithTests = new Set(
    testsCache
      .map((test) => test.id_scenario)
      .filter((id) => id !== null && id !== undefined)
  );
  const coveredScenarios = scenarioIdsWithTests.size || Math.min(testCount, scenarioCount);
  const coverage = scenarioCount ? Math.round((Math.min(coveredScenarios, scenarioCount) / scenarioCount) * 100) : 0;
  const passed = testsCache.filter((test) => normalizeStatus(test.last_status) === "PASS").length;
  const failed = testsCache.filter((test) => normalizeStatus(test.last_status) === "FAIL").length;
  const notRun = testsCache.filter((test) => !test.last_status).length;
  const latestRun = testsCache
    .map((test) => test.last_start ? new Date(test.last_start) : null)
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0];
  workspaceStats.innerHTML = "";

  const cards = [
    {
      label: "Сценарии",
      value: scenarioCount,
      detail: scenarioCount ? "готовы к генерации тестов" : "создайте первый сценарий",
      tone: "neutral"
    },
    {
      label: "Тесты",
      value: testCount,
      detail: scenarioCount ? `покрытие сценариев ${coverage}%` : "ожидают сценарии",
      tone: coverage >= 80 ? "success" : coverage > 0 ? "warning" : "neutral",
      progress: coverage
    },
    {
      label: "Последний результат",
      value: failed ? `${failed} FAIL` : passed ? `${passed} PASS` : "—",
      detail: latestRun ? `последний запуск ${latestRun.toLocaleString()}` : `${notRun || testCount} без запусков`,
      tone: failed ? "danger" : passed ? "success" : "neutral"
    }
  ];

  cards.forEach((card) => {
    const node = document.createElement("div");
    node.className = `workspace-stat-card is-${card.tone}`;

    const label = document.createElement("div");
    label.className = "workspace-stat-label";
    label.textContent = card.label;

    const value = document.createElement("div");
    value.className = "workspace-stat-value";
    value.textContent = card.value;

    const detail = document.createElement("div");
    detail.className = "workspace-stat-detail";
    detail.textContent = card.detail;

    node.append(label, value, detail);

    if (card.progress !== undefined) {
      const progress = document.createElement("div");
      progress.className = "workspace-stat-progress";
      const bar = document.createElement("span");
      bar.style.width = `${Math.max(0, Math.min(100, card.progress))}%`;
      progress.appendChild(bar);
      node.appendChild(progress);
    }

    workspaceStats.appendChild(node);
  });
}

async function api(path, options = {}) {
  if (!path) throw new Error("Empty path");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;
  console.log("API request", options.method || "GET", url);

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = null;
  try {
    if (response.status !== 204) {
      data = await response.json();
    }
  } catch (_) {
  }

  if (response.status === 401) {
    const message = data?.detail || "Сессия истекла, войдите заново";
    if (!path.startsWith("/auth/")) clearAuth();
    throw new Error(message);
  }

  if (!response.ok) {
    const err = new Error(data?.detail || `Ошибка ${response.status}`);
    console.error("API error", { url, status: response.status, data });
    throw err;
  }

  return data;
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginError) loginError.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const { access_token } = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      saveToken(access_token);
      window.location.href = "dashboard.html";
    } catch (err) {
      if (loginError) loginError.textContent = err.message;
    }
  });
}

async function ensureAuth() {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    const me = await api("/users/me");
    if (sidebarUserName && me?.username) {
      sidebarUserName.textContent = me.username;
    }
    return true;
  } catch (_) {
    redirectToLogin();
    return false;
  }
}

function logout() {
  clearAuth();
  window.location.href = "login.html";
}

function renderWorkspaceItem(workspace) {
  const card = document.createElement("div");
  card.dataset.id = workspace.id_workspace;
  card.className = "workspace-item";

  const top = document.createElement("div");
  top.className = "workspace-top";

  const title = document.createElement("h3");
  title.className = "workspace-name";
  title.textContent = workspace.name_workspace;

  top.append(title);

  const descr = document.createElement("p");
  descr.className = "muted description";
  descr.textContent = workspace.description || "Без описания";

  if (workspace.name_access_type && workspace.name_access_type !== "owner") {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = workspace.name_access_type;
    top.append(badge);
  }

  const actions = document.createElement("div");
  actions.className = "workspace-actions";

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.textContent = "Открыть";
  openBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.location.href = `workspace.html?id=${workspace.id_workspace}`;
  });

  actions.append(openBtn);

  card.append(top, descr, actions);

  card.addEventListener("click", () => {
    window.location.href = `workspace.html?id=${workspace.id_workspace}`;
  });

  return card;
}

async function loadWorkspaces() {
  if (!workspaceListOwn || !workspaceListShared) return;
  workspaceListOwn.innerHTML = "<div class='muted'>Загружаю...</div>";
  workspaceListShared.innerHTML = "";

  try {
    const data = await api("/workspaces");
    workspaceListOwn.innerHTML = "";
    workspaceListShared.innerHTML = "";

    const owned = data.filter((ws) => (ws.name_access_type || "").toLowerCase() === "owner");
    const shared = data.filter((ws) => (ws.name_access_type || "").toLowerCase() !== "owner");

    if (!owned.length) {
      workspaceListOwn.innerHTML = "<div class='muted'>Пока нет ваших проектов</div>";
    } else {
      owned.forEach((ws) => workspaceListOwn.appendChild(renderWorkspaceItem(ws)));
    }

    if (!shared.length) {
      workspaceListShared.innerHTML = "<div class='muted'>Нет доступных shared проектов</div>";
    } else {
      shared.forEach((ws) => workspaceListShared.appendChild(renderWorkspaceItem(ws)));
    }
  } catch (err) {
    workspaceListOwn.innerHTML = `<div class='muted'>${err.message}</div>`;
    workspaceListShared.innerHTML = `<div class='muted'>${err.message}</div>`;
  }
}

if (workspaceForm) {
  workspaceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!workspaceNameInput) return;

    const name = workspaceNameInput.value.trim();
    const description = workspaceDescInput?.value.trim() || null;

    if (!name) return;

    try {
      await api("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name_workspace: name, description })
      });
      workspaceNameInput.value = "";
      if (workspaceDescInput) workspaceDescInput.value = "";
      await loadWorkspaces();
    } catch (err) {
      showInfoModal(err.message || "Не удалось создать workspace");
    }
  });
}

function resetConnectionPanel() {
  currentWorkspaceId = null;
  currentConnectionId = null;
  if (connectionWorkspaceLabel) connectionWorkspaceLabel.textContent = "Выберите рабочее пространство";
  if (connectionStatus) connectionStatus.textContent = "";
  if (connectionBaseUrl) connectionBaseUrl.value = "";
  if (connectionAuthType) connectionAuthType.value = "1";
  if (authUsername) authUsername.value = "";
  if (authPassword) authPassword.value = "";
  if (authToken) authToken.value = "";
  if (authApiKey) authApiKey.value = "";
  if (deleteConnectionBtn) deleteConnectionBtn.disabled = true;
  if (connectionCurrent) connectionCurrent.textContent = "Нет сохраненного подключения";
  updateAuthVisibility(1);
  renderWorkspaceStats();
}

function getWorkspaceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  if (!idParam) return null;
  const numeric = Number(idParam);
  return Number.isFinite(numeric) ? numeric : null;
}

async function bootstrapWorkspacePage() {
  if (backToProjects) {
    backToProjects.addEventListener("click", () => {
      window.location.href = "dashboard.html#projects";
    });
  }

  const id = getWorkspaceIdFromUrl();
  if (!id) {
    if (connectionStatus) connectionStatus.textContent = "Не передан id workspace";
    return;
  }

  currentWorkspaceId = id;

  try {
    const workspaces = await api("/workspaces");
    const ws = workspaces.find((w) => w.id_workspace === id);

    if (!ws) {
      if (workspaceTitle) workspaceTitle.textContent = "Workspace не найден";
      if (connectionStatus) connectionStatus.textContent = "Workspace не найден";
      return;
    }

    if (workspaceTitle) workspaceTitle.textContent = ws.name_workspace;
    if (workspaceDescription) workspaceDescription.textContent = ws.description || "Без описания";
    if (connectionWorkspaceLabel) connectionWorkspaceLabel.textContent = ws.name_workspace;
    if (deleteWorkspaceBtn) deleteWorkspaceBtn.dataset.workspaceId = String(id);
    currentAccessType = (ws.name_access_type || "").toLowerCase();
    currentIsOwner = (currentAccessType === "owner");
    renderWorkspaceStats();
    if (createScenarioBtn) {
      const canCreate = currentAccessType !== "viewer";
      createScenarioBtn.style.display = canCreate ? "inline-flex" : "none";
      if (canCreate) {
        createScenarioBtn.onclick = () => window.location.href = `scenario_create.html?workspace=${id}`;
      }
    }
    if (generateTestsBtn) {
      const canGenerate = currentAccessType !== "viewer";
      generateTestsBtn.style.display = canGenerate ? "inline-flex" : "none";
      if (canGenerate) {
        generateTestsBtn.onclick = async () => {
          await generateAllScenarioTests(id, generateTestsBtn);
        };
      }
    }
    if (runAllTestsBtn) {
      const canRun = currentAccessType !== "viewer";
      runAllTestsBtn.style.display = canRun ? "inline-flex" : "none";
      if (canRun) {
        runAllTestsBtn.onclick = async () => {
          await runAllWorkspaceTests(id, runAllTestsBtn);
        };
      }
    }
    if (workspaceLogHistoryBtn) {
      workspaceLogHistoryBtn.onclick = async () => {
        if (workspaceLogHistoryModal) workspaceLogHistoryModal.classList.add("active");
        await loadWorkspaceExecutions(id);
      };
    }
    // UI ограничения для viewer
    if (currentAccessType === "viewer") {
      if (deleteWorkspaceBtn) deleteWorkspaceBtn.style.display = "none";
      if (connectionPanel) connectionPanel.style.display = "none";
      if (membersPanel) membersPanel.style.display = "none";
    }

    await loadConnections(id, ws.name_workspace);
    await loadScenarios(id);
    await loadTests(id);
    startActiveRunsPolling(id);
    if (currentIsOwner) {
      if (membersPanel) membersPanel.style.display = "block";
      await loadMembers(id);
    } else {
      if (membersPanel) membersPanel.style.display = "none";
    }
    initDeleteWorkspaceButton();
  } catch (err) {
    if (connectionStatus) connectionStatus.textContent = err.message;
  }
}

if (scenarioSearch) {
  scenarioSearch.addEventListener("input", () => renderScenarios());
}

if (scenarioSort) {
  scenarioSort.addEventListener("change", () => renderScenarios());
}

if (testSearch) {
  testSearch.addEventListener("input", () => renderTests());
}

if (testSort) {
  testSort.addEventListener("change", () => renderTests());
}

function buildAuthData(idAuthType) {
  const payload = {};

  if (idAuthType === 1) {
    if (authUsername?.value) payload.username = authUsername.value.trim();
    if (authPassword?.value) payload.password = authPassword.value.trim();
  }

  if (idAuthType === 2 && authToken?.value) {
    payload.token = authToken.value.trim();
  }

  if (idAuthType === 3 && authApiKey?.value) {
    payload.api_key = authApiKey.value.trim();
  }

  return payload;
}

function updateAuthVisibility(idAuthType) {
  document.querySelectorAll(".auth-block").forEach((block) => {
    block.style.display = "none";
  });

  if (idAuthType === 1) {
    document.querySelectorAll(".auth-basic").forEach((b) => (b.style.display = "flex"));
  } else if (idAuthType === 2) {
    document.querySelectorAll(".auth-bearer").forEach((b) => (b.style.display = "block"));
  } else if (idAuthType === 3) {
    document.querySelectorAll(".auth-apikey").forEach((b) => (b.style.display = "block"));
  }
}

async function loadScenarios(workspaceId) {
  if (!scenarioList) return;
  scenarioList.innerHTML = "<div class='muted'>Загружаю сценарии...</div>";
  try {
    scenarioCache = await api(`/scenarios/${workspaceId}`);
    renderScenarios();
    renderWorkspaceStats();
  } catch (err) {
    scenarioList.innerHTML = `<div class='muted'>${err.message}</div>`;
    renderWorkspaceStats();
  }
}

function renderScenarios() {
  if (!scenarioList) return;
  const term = (scenarioSearch?.value || "").trim().toLowerCase();
  const sort = scenarioSort?.value || "name-asc";

  let items = [...scenarioCache];

  if (term) {
    items = items.filter((sc) => (sc.name_scenario || "").toLowerCase().includes(term));
  }

  items.sort((a, b) => {
    switch (sort) {
      case "name-desc":
        return (b.name_scenario || "").localeCompare(a.name_scenario || "");
      case "id-desc":
        return (b.id_scenario || 0) - (a.id_scenario || 0);
      case "id-asc":
        return (a.id_scenario || 0) - (b.id_scenario || 0);
      case "name-asc":
      default:
        return (a.name_scenario || "").localeCompare(b.name_scenario || "");
    }
  });

  if (!items.length) {
    scenarioList.innerHTML = "<div class='muted'>Пока нет сценариев</div>";
    return;
  }

  scenarioList.innerHTML = "";
  items.forEach((sc) => {
    const el = document.createElement("div");
    el.className = "scenario-item scenario-card scenario-card--scenario";

    const head = document.createElement("div");
    head.className = "card-head";

    const chip = document.createElement("span");
    chip.className = "card-chip";
    chip.textContent = "Сценарий";

    const idBadge = document.createElement("span");
    idBadge.className = "card-id";
    idBadge.textContent = `#${sc.id_scenario || "—"}`;

    head.append(chip, idBadge);

    const title = document.createElement("h4");
    title.textContent = sc.name_scenario || "Без имени";
    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = "Нажмите, чтобы открыть";
    el.append(head, title, meta);

    const actions = document.createElement("div");
    actions.className = "scenario-actions-inline";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "ghost";
    openBtn.textContent = "Открыть";
    openBtn.onclick = () => window.location.href = `./scenario.html?workspace=${currentWorkspaceId}&id=${sc.id_scenario}`;

    const genBtn = document.createElement("button");
    genBtn.type = "button";
    genBtn.className = "ghost";
    genBtn.textContent = "Сгенерировать тест";
    genBtn.onclick = async (e) => {
      e.stopPropagation();
      if (!currentWorkspaceId) return;
      genBtn.disabled = true;
      genBtn.textContent = "Генерирую...";
      try {
        await api(`/tests/generate/${currentWorkspaceId}/${sc.id_scenario}`, { method: "POST" });
        await loadTests(currentWorkspaceId);
        renderWorkspaceStats();
        showInfoModal("Тест сгенерирован");
      } catch (err) {
        showInfoModal(err.message || "Не удалось сгенерировать тест");
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = "Сгенерировать тест";
      }
    };

    actions.append(openBtn, genBtn);
    el.append(actions);

    el.addEventListener("click", () => {
      window.location.href = `scenario.html?workspace=${currentWorkspaceId}&id=${sc.id_scenario}`;
    });
    scenarioList.appendChild(el);
  });
}

async function generateAllScenarioTests(workspaceId, btn) {
  if (!workspaceId) return;
  const scenarios = [...scenarioCache].filter((sc) => sc.id_scenario);
  if (!scenarios.length) {
    showInfoModal("В workspace нет сценариев для генерации тестов");
    return;
  }

  const prevText = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = `Генерация 0/${scenarios.length}`;
  }

  const failed = [];
  try {
    for (let i = 0; i < scenarios.length; i += 1) {
      const scenario = scenarios[i];
      if (btn) btn.textContent = `Генерация ${i + 1}/${scenarios.length}`;
      try {
        await api(`/tests/generate/${workspaceId}/${scenario.id_scenario}`, { method: "POST" });
      } catch (err) {
        failed.push(`${scenario.name_scenario || `#${scenario.id_scenario}`}: ${err.message}`);
      }
    }

    await loadTests(workspaceId);
    renderWorkspaceStats();

    if (failed.length) {
      showInfoModal(`Генерация завершена с ошибками: ${failed.length}/${scenarios.length}`);
    } else {
      showInfoModal(`Сгенерированы тесты по сценариям: ${scenarios.length}`);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevText || "Сгенерировать все тесты";
    }
  }
}

async function loadTests(workspaceId) {
  if (!testList) return;
  testList.innerHTML = "<div class='muted'>Загружаю тесты...</div>";
  try {
    testsCache = await api(`/tests/${workspaceId}`);
    renderTests();
    renderWorkspaceStats();
  } catch (err) {
    testList.innerHTML = `<div class='muted'>${err.message}</div>`;
    renderWorkspaceStats();
  }
}

function renderTests() {
  if (!testList) return;
  const term = (testSearch?.value || "").trim().toLowerCase();
  const sort = testSort?.value || "name-asc";

  let items = [...testsCache];

  if (term) {
    items = items.filter((t) => (t.name_test || "").toLowerCase().includes(term));
  }

  items.sort((a, b) => {
    switch (sort) {
      case "name-desc":
        return (b.name_test || "").localeCompare(a.name_test || "");
      case "id-desc":
        return (b.id_test || 0) - (a.id_test || 0);
      case "id-asc":
        return (a.id_test || 0) - (b.id_test || 0);
      case "name-asc":
      default:
        return (a.name_test || "").localeCompare(b.name_test || "");
    }
  });

  if (!items.length) {
    testList.innerHTML = "<div class='muted'>Пока нет тестов</div>";
    return;
  }

  testList.innerHTML = "";
  items.forEach((t) => {
    const el = document.createElement("div");
    el.className = "scenario-item scenario-card scenario-card--test";

    const head = document.createElement("div");
    head.className = "card-head";

    const chip = document.createElement("span");
    chip.className = "card-chip";
    chip.textContent = "Тест";

    const idBadge = document.createElement("span");
    idBadge.className = "card-id";
    idBadge.textContent = `#${t.id_test || "—"}`;

    head.append(chip, idBadge);

    const title = document.createElement("h4");
    title.textContent = t.name_test || `Тест #${t.id_test}`;

    const meta = document.createElement("p");
    meta.className = "muted";
    const lastStatus = t.last_status ? ` · Статус: ${t.last_status}` : "";
    const lastStart = t.last_start ? ` · ${new Date(t.last_start).toLocaleString()}` : "";
    meta.textContent = `ID: ${t.id_test || "—"}${lastStatus}${lastStart}`;

    el.append(head, title, meta);

    const actions = document.createElement("div");
    actions.className = "scenario-actions-inline";
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "ghost";
    openBtn.textContent = "Открыть";
    openBtn.onclick = () => window.location.href = `./test.html?workspace=${currentWorkspaceId}&id=${t.id_test}`;
    const runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.dataset.runTestId = String(t.id_test);
    runBtn.textContent = "Запустить";
    runBtn.onclick = async (e) => {
      e.stopPropagation();
      await runTestApi(t.id_test, runBtn);
      if (currentWorkspaceId) await loadTests(currentWorkspaceId);
    };
    actions.append(openBtn, runBtn);
    el.append(actions);

    testList.appendChild(el);
  });
  applyActiveRunState();
}

async function runAllWorkspaceTests(workspaceId, btn) {
  if (!workspaceId) return;
  const tests = [...testsCache].filter((test) => test.id_test);
  if (!tests.length) {
    showInfoModal("В workspace нет тестов для запуска");
    return;
  }

  const prevText = btn?.textContent;
  if (btn) {
    setButtonLoading(btn, true, "Выполняется запуск всех тестов");
  }

  const failed = [];
  try {
    const result = await api(`/tests/${workspaceId}/run-all`, { method: "POST" });
    const executions = result?.executions || [];
    executions.forEach((row) => {
      const failedIndexes = row?.failed_indexes || [];
      if (normalizeStatus(row?.status) === "FAIL" || failedIndexes.length) {
        failed.push(row.name_test || `#${row.id_test}`);
      }
    });

    await loadTests(workspaceId);
    if (workspaceLogHistoryModal?.classList.contains("active")) {
      await loadWorkspaceExecutions(workspaceId);
    }

    if (failed.length) {
      showInfoModal(`Запуск ${result?.name || "all_tests"} завершен с ошибками: ${failed.length}/${tests.length}`);
    } else {
      showInfoModal(`Все тесты запущены: ${result?.name || tests.length}`);
    }
  } finally {
    if (btn) {
      setButtonLoading(btn, false);
      if (!btn.textContent) btn.textContent = prevText || "Запустить все тесты";
    }
  }
}

function groupWorkspaceExecutionRows(rows) {
  const grouped = [];
  const allTestGroups = new Map();

  rows.forEach((row) => {
    if (!row.is_all_tests || !row.log_name) {
      grouped.push({ type: "single", rows: [row], row });
      return;
    }

    if (!allTestGroups.has(row.log_name)) {
      const group = { type: "all_tests", log_name: row.log_name, rows: [], row };
      allTestGroups.set(row.log_name, group);
      grouped.push(group);
    }

    const group = allTestGroups.get(row.log_name);
    group.rows.push(row);
    if (new Date(row.start_at) < new Date(group.row.start_at)) {
      group.row = row;
    }
  });

  return grouped;
}

function renderTestContent(container, content) {
  if (!container) return;
  if (!content || typeof content !== "object") {
    container.textContent = "Нет данных теста";
    return;
  }

  const sectionsOrder = ["PRESET", "TESTS", "AFTER-TEST"];
  container.innerHTML = "";

  sectionsOrder.forEach((sectionKey) => {
    if (sectionKey === "TESTS") {
      const testIds = Object.keys(content).filter((k) => k !== "PRESET" && k !== "AFTER-TEST");
      if (!testIds.length) return;
      const section = document.createElement("div");
      section.className = "test-section";
      const title = document.createElement("h3");
      title.innerHTML = '<span class="badge-soft">TESTS</span>';
      section.append(title);

      testIds.sort((a, b) => Number(a) - Number(b)).forEach((tid) => {
        const card = document.createElement("div");
        card.className = "test-card";
        const data = content[tid] || {};
        const h4 = document.createElement("h4");
        h4.textContent = data.description || `Тест #${tid}`;
        const meta = document.createElement("p");
        meta.className = "muted";
        meta.textContent = `№: ${tid}`;
        card.append(h4, meta);

        const stepsWrap = document.createElement("div");
        stepsWrap.className = "step-list";

        Object.entries(data)
          .filter(([k]) => k.includes("."))
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .forEach(([stepId, step]) => {
            stepsWrap.appendChild(renderStepCard(stepId, step));
          });

        card.append(stepsWrap);
        section.append(card);
      });

      container.append(section);
    } else if (content[sectionKey]) {
      const section = document.createElement("div");
      section.className = "test-section";
      const title = document.createElement("h3");
      title.innerHTML = `<span class="badge-soft">${sectionKey}</span>`;
      section.append(title);

      const data = content[sectionKey];
      const steps = data?.steps || data; // иногда без steps
      const stepsWrap = document.createElement("div");
      stepsWrap.className = "step-list";
      Object.entries(steps || {})
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .forEach(([stepId, step]) => {
          stepsWrap.appendChild(renderStepCard(stepId, step));
        });
      section.append(stepsWrap);
      container.append(section);
    }
  });
}

function renderStepCard(stepId, step) {
  const card = document.createElement("div");
  card.className = "step-card";

  const head = document.createElement("div");
  head.className = "step-head";

  const method = document.createElement("span");
  method.className = "pill-method";
  method.textContent = step.type || step.method || "—";

  const endpoint = document.createElement("span");
  endpoint.className = "pill-endpoint";
  endpoint.textContent = step.endpoint || "—";

  const stepTag = document.createElement("span");
  stepTag.className = "pill-step";
  stepTag.textContent = `step ${stepId}`;

  head.append(method, endpoint, stepTag);

  const meta = document.createElement("div");
  meta.className = "step-meta";
  if (step.errCode !== undefined) meta.append(textPill(`errCode: ${step.errCode}`));
  if (step.httpCode !== undefined) meta.append(textPill(`httpCode: ${step.httpCode}`));

  card.append(head, meta);

  if (step.schema) {
    card.append(makeCodeBlock("schema", step.schema));
  }
  if (step.arguments) {
    card.append(makeCodeBlock("arguments", step.arguments));
  }
  if (step.validation) {
    card.append(makeCodeBlock("validation", step.validation));
  }

  return card;
}

function textPill(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function makeCodeBlock(label, obj) {
  const wrap = document.createElement("div");
  const lbl = document.createElement("div");
  lbl.className = "muted";
  lbl.textContent = label;
  const pre = document.createElement("div");
  pre.className = "code-block";
  pre.textContent = JSON.stringify(obj, null, 2);
  wrap.append(lbl, pre);
  return wrap;
}

function normalizeLogText(log) {
  if (log === null || log === undefined || log === "") return "";
  if (typeof log === "string") return log;
  return JSON.stringify(log, null, 2);
}

function parseLogChunks(logText) {
  const chunks = [];
  const lines = normalizeLogText(logText).replace(/\r\n/g, "\n").split("\n");

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
      pre.textContent = chunk.text || "empty";
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

function setInlineRunLogVisible(visible) {
  if (!testRunLogWrap) return;
  testRunLogWrap.style.display = visible ? "block" : "none";
  if (!visible) {
    testRunLogWrap.classList.remove("is-collapsed");
    if (toggleTestRunLogBtn) toggleTestRunLogBtn.textContent = "Свернуть";
  }
}

if (toggleTestRunLogBtn && testRunLogWrap) {
  toggleTestRunLogBtn.addEventListener("click", () => {
    const collapsed = testRunLogWrap.classList.toggle("is-collapsed");
    toggleTestRunLogBtn.textContent = collapsed ? "Развернуть" : "Свернуть";
  });
}

if (closeTestRunLogBtn) {
  closeTestRunLogBtn.addEventListener("click", () => {
    if (testRunLog) testRunLog.innerHTML = "";
    setInlineRunLogVisible(false);
  });
}

async function runTestApi(testId, btn, workspaceId = currentWorkspaceId, statusEl = null, options = {}) {
  if (!workspaceId || !testId) return;
  const silent = Boolean(options.silent);
  const refreshExecutions = options.refreshExecutions !== false;
  const prevText = btn?.textContent;
  if (btn) {
    setButtonLoading(btn, true, "Выполняется запуск теста");
  }
  if (statusEl) {
    setStatusLoading(statusEl, true);
  }
  console.log(`Running test ${testId} in workspace ${workspaceId}`);
  try {
    const res = await api(`/tests/${workspaceId}/run/${testId}`, { method: "POST" });
    const status = res?.status || "unknown";
    const failedList = res?.failed_indexes || [];
    const failed = failedList.length ? `\nFailed: ${failedList.join(", ")}` : "";
    if (!silent) showInfoModal(`Статус: ${status}${failed}`);
    if (testRunLog && res?.log !== undefined) {
      renderLog(testRunLog, res.log || "");
      setInlineRunLogVisible(true);
    }
    if (statusEl) {
      statusEl.className = `badge-soft status-badge ${status === "FAIL" ? "status-fail" : "status-success"}`;
      statusEl.textContent = failedList.length ? `Статус: ${status}, failed: ${failedList.join(", ")}` : `Статус: ${status}`;
      statusEl.style.display = "inline-flex";
      statusEl.removeAttribute("aria-busy");
      statusEl.removeAttribute("aria-label");
    }
    if (refreshExecutions) await loadExecutions(workspaceId, testId);
    return res;
  } catch (err) {
    if (!silent) showInfoModal(err.message || "Ошибка запуска теста");
    if (statusEl) {
      statusEl.className = "badge-soft status-badge status-error";
      statusEl.textContent = "Ошибка запуска";
      statusEl.removeAttribute("aria-busy");
      statusEl.removeAttribute("aria-label");
    }
    if (silent) throw err;
  } finally {
    if (btn) {
      setButtonLoading(btn, false);
      if (!btn.textContent) btn.textContent = prevText || "Запустить";
    }
  }
}

async function bootstrapTestPage() {
  const params = new URLSearchParams(window.location.search);
  const workspaceId = Number(params.get("workspace"));
  const testId = Number(params.get("id"));
  if (!workspaceId || !testId) {
    showInfoModal("Не переданы параметры теста");
    return;
  }
  if (backToWorkspaceFromTest) {
    backToWorkspaceFromTest.onclick = () => window.location.href = `workspace.html?id=${workspaceId}`;
  }
  if (runTestDetailBtn) {
    runTestDetailBtn.onclick = async () => {
      await runTestApi(testId, runTestDetailBtn, workspaceId, testRunStatus);
    };
  }
  startActiveRunsPolling(workspaceId);
  try {
    const data = await api(`/tests/${workspaceId}/detail/${testId}`);
    if (testTitle) testTitle.textContent = data.name_test || `Тест #${data.id_test}`;
    const genAt = data.generated_at ? new Date(data.generated_at).toLocaleString() : "—";
    if (testMeta) testMeta.textContent = `ID: ${data.id_test} · Сценарий: ${data.id_scenario} · Сгенерирован: ${genAt}`;
    if (testContent) renderTestContent(testContent, data.content_test);
    setInlineRunLogVisible(false);
    if (testRunLog) testRunLog.innerHTML = "";
    await loadExecutions(workspaceId, testId);
  } catch (err) {
    showInfoModal(err.message || "Не удалось загрузить тест");
  }
}

async function loadExecutions(workspaceId, testId) {
  if (!executionsList) return;
  executionsList.innerHTML = "<div class='muted'>Загружаю...</div>";
  try {
    const data = await api(`/tests/${workspaceId}/executions/${testId}`);
    if (!data.length) {
      executionsList.innerHTML = "<div class='muted'>Запусков пока нет</div>";
      return;
    }
    executionsList.innerHTML = "";
    data.forEach((row) => {
      const item = document.createElement("div");
      item.className = "execution-item";
      const meta = document.createElement("div");
      meta.className = "execution-meta";
      const started = row.start_at ? new Date(row.start_at).toLocaleString() : "";
      meta.innerHTML = `<strong>${row.test_status || "unknown"}</strong><span class='muted'>${started}</span><span class='muted'>time: ${row.time_execution ?? "—"}s, failed: ${(row.failed_indexes || []).join(", ") || "—"}</span>`;
      const actions = document.createElement("div");
      actions.className = "actions wrap";
      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "ghost";
      viewBtn.textContent = "Показать лог";
      viewBtn.onclick = async () => {
        await loadExecutionLog(workspaceId, row.id_test_execution);
      };
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "ghost danger";
      deleteBtn.textContent = "Удалить лог";
      deleteBtn.onclick = async () => {
        const confirmed = window.confirm("Удалить этот лог из истории запусков?");
        if (!confirmed) return;
        try {
          await api(`/tests/${workspaceId}/executions/log/${row.id_test_execution}`, {
            method: "DELETE"
          });
          if (currentExecutionLogId === row.id_test_execution && logModal) {
            logModal.classList.remove("active");
            currentExecutionLogId = null;
          }
          await loadExecutions(workspaceId, testId);
        } catch (err) {
          showInfoModal(err.message || "Не удалось удалить лог");
        }
      };
      actions.append(viewBtn, deleteBtn);
      item.append(meta, actions);
      executionsList.appendChild(item);
    });
  } catch (err) {
    executionsList.innerHTML = `<div class='muted'>${err.message}</div>`;
  }
}

async function loadWorkspaceExecutions(workspaceId) {
  if (!workspaceLogHistoryList) return;
  workspaceLogHistoryList.innerHTML = "<div class='muted'>Загружаю...</div>";
  try {
    const data = await api(`/tests/${workspaceId}/executions`);
    if (!data.length) {
      workspaceLogHistoryList.innerHTML = "<div class='muted'>Логов пока нет</div>";
      return;
    }

    workspaceLogHistoryList.innerHTML = "";
    groupWorkspaceExecutionRows(data).forEach((entry) => {
      const row = entry.row;
      const isAllTests = entry.type === "all_tests";
      const item = document.createElement("div");
      item.className = "execution-item workspace-log-item";

      const meta = document.createElement("div");
      meta.className = "execution-meta";
      const started = row.start_at ? new Date(row.start_at).toLocaleString() : "";
      const failed = Array.isArray(row.failed_indexes)
        ? row.failed_indexes.join(", ")
        : row.failed_indexes;
      if (isAllTests) {
        const failedCount = entry.rows.filter((itemRow) => {
          const failedIndexes = itemRow.failed_indexes || [];
          return normalizeStatus(itemRow.test_status) === "FAIL" || failedIndexes.length;
        }).length;
        meta.innerHTML = `
          <strong>${entry.log_name}</strong>
          <span class="muted">Общий лог запуска всех тестов · ${started}</span>
          <span class="muted">Тестов: ${entry.rows.length}, с ошибками: ${failedCount || "—"}</span>
        `;
      } else {
        meta.innerHTML = `
          <strong>${row.name_test || `Тест #${row.id_test}`}</strong>
          <span class="muted">${row.test_status || "unknown"} · ${started}</span>
          <span class="muted">ID теста: ${row.id_test}, сценарий: ${row.id_scenario}, time: ${row.time_execution ?? "—"}s, failed: ${failed || "—"}</span>
        `;
      }

      const actions = document.createElement("div");
      actions.className = "actions wrap";

      const openTestBtn = document.createElement("button");
      openTestBtn.type = "button";
      openTestBtn.className = "ghost";
      openTestBtn.textContent = "Открыть тест";
      openTestBtn.onclick = () => {
        window.location.href = `test.html?workspace=${workspaceId}&id=${row.id_test}`;
      };

      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "ghost";
      viewBtn.textContent = "Показать лог";
      viewBtn.onclick = async () => {
        await loadExecutionLog(workspaceId, row.id_test_execution);
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "ghost danger";
      deleteBtn.textContent = "Удалить лог";
      deleteBtn.onclick = async () => {
        const confirmed = window.confirm(isAllTests
          ? "Удалить общий лог и все записи этого запуска из истории workspace?"
          : "Удалить этот лог из истории workspace?");
        if (!confirmed) return;
        try {
          for (const itemRow of entry.rows) {
            await api(`/tests/${workspaceId}/executions/log/${itemRow.id_test_execution}`, {
              method: "DELETE"
            });
          }
          if (currentExecutionLogId === row.id_test_execution && logModal) {
            logModal.classList.remove("active");
            currentExecutionLogId = null;
          }
          await loadWorkspaceExecutions(workspaceId);
          await loadTests(workspaceId);
        } catch (err) {
          showInfoModal(err.message || "Не удалось удалить лог");
        }
      };

      if (isAllTests) {
        actions.append(viewBtn, deleteBtn);
      } else {
        actions.append(openTestBtn, viewBtn, deleteBtn);
      }
      item.append(meta, actions);
      workspaceLogHistoryList.appendChild(item);
    });
  } catch (err) {
    workspaceLogHistoryList.innerHTML = `<div class='muted'>${err.message}</div>`;
  }
}

async function loadExecutionLog(workspaceId, execId) {
  if (!executionLogModal || !logModal) return;
  currentExecutionLogId = execId;
  executionLogModal.innerHTML = "";
  const loading = document.createElement("div");
  loading.className = "log-empty";
  loading.textContent = "Загружаю лог...";
  executionLogModal.appendChild(loading);
  logModal.classList.add("active");
  try {
    const res = await api(`/tests/${workspaceId}/executions/log/${execId}`);
    const logText = normalizeLogText(res?.log ?? res);
    renderLog(executionLogModal, logText);
    if (logDownloadBtn) {
      logDownloadBtn.onclick = () => downloadText(logText, `${res?.name || `execution_${execId}`}.log`);
    }
  } catch (err) {
    renderLog(executionLogModal, err.message || "Не удалось загрузить лог");
  }
}

if (logModal && logModalClose) {
  logModalClose.onclick = () => {
    logModal.classList.remove("active");
    currentExecutionLogId = null;
  };
  logModal.addEventListener("click", (e) => {
    if (e.target === logModal) {
      logModal.classList.remove("active");
      currentExecutionLogId = null;
    }
  });
}

if (deleteAllTestLogsBtn) {
  deleteAllTestLogsBtn.onclick = async () => {
    const { workspace, id } = getParams();
    const workspaceId = Number(workspace);
    const testId = Number(id);

    if (!workspaceId || !testId) {
      showInfoModal("Не переданы параметры теста");
      return;
    }

    const confirmed = window.confirm("Удалить всю историю запусков этого теста?");
    if (!confirmed) return;

    try {
      await api(`/tests/${workspaceId}/executions/${testId}`, {
        method: "DELETE"
      });
      if (logModal) logModal.classList.remove("active");
      currentExecutionLogId = null;
      await loadExecutions(workspaceId, testId);
      showInfoModal("Все логи удалены");
    } catch (err) {
      showInfoModal(err.message || "Не удалось удалить логи");
    }
  };
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function deleteWorkspaceApi(id) {
  try {
    await api(`/workspaces/${id}`, { method: "DELETE" });
  } catch (err) {
    await api(`/workspaces/${id}/`, { method: "DELETE" });
  }
  console.log("Workspace deleted", id);
}

async function loadMembers(workspaceId) {
  if (!membersList) return;
  membersList.innerHTML = "<div class='muted'>Загружаю участников...</div>";
  try {
    const members = await api(`/workspaces/${workspaceId}/members`);
    membersLast = members;
    if (!members.length) {
      membersList.innerHTML = "<div class='muted'>Пока никого нет</div>";
      updateMembersSummary();
      return;
    }
    membersList.innerHTML = "";
    members.forEach((m) => {
      const item = document.createElement("div");
      item.className = "member-item";
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = m.username;
      const access = document.createElement("div");
      access.className = "access";
      access.textContent = m.name_access_type;
      item.append(name, access);

      if (currentIsOwner && m.name_access_type !== "owner") {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "ghost danger";
        delBtn.textContent = "Удалить";
        delBtn.onclick = () => {
          cacheDeleteModalElements();
          if (!deleteModal || !deleteModalConfirm || !deleteModalCancel || !deleteModalText) return;
          deleteModalText.textContent = `Удалить участника "${m.username}"?`;
          deleteModal.dataset.memberId = m.id_user;
          deleteModal.dataset.action = "delete-member";
          deleteModal.classList.add("active");

          const closeModal = () => {
            deleteModal.classList.remove("active");
            deleteModal.dataset.memberId = "";
            deleteModal.dataset.action = "";
            deleteModalConfirm.onclick = null;
            deleteModalCancel.onclick = null;
          };

          const onCancel = (e) => {
            e?.preventDefault();
            closeModal();
          };

          const onConfirm = async (e) => {
            e?.preventDefault();
            const targetId = deleteModal.dataset.memberId;
            if (!targetId) return closeModal();
            deleteModalConfirm.disabled = true;
            try {
              await api(`/workspaces/${currentWorkspaceId}/members/${targetId}`, { method: "DELETE" });
              if (memberStatus) memberStatus.textContent = "Участник удален";
              await loadMembers(currentWorkspaceId);
            } catch (err) {
              if (memberStatus) memberStatus.textContent = err.message;
            } finally {
              deleteModalConfirm.disabled = false;
              closeModal();
            }
          };

          deleteModalCancel.onclick = onCancel;
          deleteModalConfirm.onclick = onConfirm;
          deleteModal.addEventListener("click", (e) => { if (e.target === deleteModal) onCancel(e); }, { once: true });
        };

        item.append(delBtn);
      }

      membersList.appendChild(item);
    });
    updateMembersSummary();
  } catch (err) {
    membersList.innerHTML = `<div class='muted'>${err.message}</div>`;
    membersLast = [];
    updateMembersSummary();
  }
}

function initDeleteWorkspaceButton() {
  if (!deleteWorkspaceBtn) return;
  cacheDeleteModalElements();
  deleteWorkspaceBtn.onclick = async (e) => {
    e.preventDefault();
    const targetId = deleteWorkspaceBtn.dataset.workspaceId || currentWorkspaceId;
    console.log("Delete workspace clicked", { targetId, currentWorkspaceId, dataset: deleteWorkspaceBtn.dataset });
    if (!targetId) return showInfoModal("Не удалось определить workspace для удаления");
    if (!currentIsOwner) return showInfoModal("Только владелец может удалить workspace");

    const name = workspaceTitle?.textContent || "workspace";
    if (deleteModalText) deleteModalText.textContent = `Удалить "${name}"? Это действие нельзя отменить.`;
    deleteModal.dataset.workspaceId = targetId;
    deleteModal.classList.add("active");
  };
}

function initDeleteModal() {
  cacheDeleteModalElements();
  if (!deleteModal) return;

  const closeModal = () => {
    deleteModal.classList.remove("active");
  };

  if (deleteModalCancel) {
    deleteModalCancel.onclick = (e) => {
      e.preventDefault();
      closeModal();
    };
  }

  if (deleteModalConfirm) {
    deleteModalConfirm.onclick = async (e) => {
      e.preventDefault();
      const targetId = deleteModal.dataset.workspaceId || currentWorkspaceId;
      if (!targetId) return;
      deleteModalConfirm.disabled = true;
      try {
        await deleteWorkspaceApi(targetId);
        window.location.href = "dashboard.html#projects";
      } catch (err) {
        if (connectionStatus) connectionStatus.textContent = err.message;
        console.error("Failed to delete workspace", err);
        showInfoModal(err.message || "Не удалось удалить");
      } finally {
        deleteModalConfirm.disabled = false;
        closeModal();
      }
    };
  }

  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeModal();
  });
}

function showInfoModal(text) {
  const message = String(text ?? "");
  if (window.Notify) {
    new Notify({
      status: inferNotifyStatus(message),
      text: message,
      effect: "slide",
      type: "filled",
      position: "right top",
      speed: 250,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 3500,
      gap: 12,
      distance: 18
    });
    return;
  }

  cacheDeleteModalElements();
  if (!infoModal || !infoModalText || !infoModalClose) return alert(message);
  infoModalText.textContent = message;
  infoModal.classList.add("active");
  infoModalClose.onclick = () => infoModal.classList.remove("active");
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) infoModal.classList.remove("active");
  });
}

if (memberForm) {
  memberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentWorkspaceId) return;
    if (!currentIsOwner) {
      if (memberStatus) memberStatus.textContent = "Только владелец может изменять доступы";
      return;
    }
    const username = memberUsername?.value.trim();
    const access = memberAccess?.value;
    if (!username) return;
    if (memberStatus) memberStatus.textContent = "Отправляю...";
    try {
      await api(`/workspaces/${currentWorkspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({ username, access })
      });
      if (memberStatus) memberStatus.textContent = "Права обновлены";
      await loadMembers(currentWorkspaceId);
      memberUsername.value = "";
    } catch (err) {
      if (memberStatus) memberStatus.textContent = err.message;
    }
  });
}

async function loadConnections(workspaceId, workspaceName) {
  if (!connectionStatus) return;
  connectionStatus.textContent = "Загружаю подключение...";
  connectionWorkspaceLabel.textContent = workspaceName || `Workspace #${workspaceId}`;
  currentConnectionId = null;
   connectionLastData = null;

  try {
    const list = await api(`/connections/${workspaceId}`);
    const first = list[0];

    if (!first) {
      connectionStatus.textContent = "Подключение еще не настроено для этого workspace";
      if (deleteConnectionBtn) deleteConnectionBtn.disabled = true;
      if (connectionCurrent) connectionCurrent.textContent = "Нет сохраненного подключения";
      updateConnectionSummary();
      currentConnectionId = null;
      renderWorkspaceStats();
      return;
    }

    currentConnectionId = first.id_connection;
    if (deleteConnectionBtn) deleteConnectionBtn.disabled = false;
    if (connectionBaseUrl) connectionBaseUrl.value = first.base_url || "";
    if (connectionAuthType) connectionAuthType.value = String(first.id_auth_type);
    updateAuthVisibility(first.id_auth_type);

    if (authUsername) authUsername.value = "";
    if (authPassword) authPassword.value = "";
    if (authToken) authToken.value = "";
    if (authApiKey) authApiKey.value = "";

    const authData = first.auth_data || {};
    if (first.id_auth_type === 1) {
      if (authUsername) authUsername.value = authData.username || "";
      if (authPassword) authPassword.value = authData.password || "";
    }

    if (first.id_auth_type === 2 && authToken) {
      authToken.value = authData.token || "";
    }

    if (first.id_auth_type === 3 && authApiKey) {
      authApiKey.value = authData.api_key || "";
    }

    if (connectionCurrent) {
      const authSummary = (() => {
        if (first.id_auth_type === 1) return `Basic: ${authData.username || "—"}`;
        if (first.id_auth_type === 2) return `Bearer: ${authData.token ? "***" : "—"}`;
        if (first.id_auth_type === 3) return `API Key: ${authData.api_key ? "***" : "—"}`;
        return "—";
      })();

      connectionLastData = {
        base_url: first.base_url || "—",
        authSummary
      };

      connectionCurrent.innerHTML = `
        <div><strong>Base URL:</strong> ${first.base_url || "—"}</div>
        <div><strong>Auth:</strong> ${authSummary}</div>
      `;
    }

    connectionStatus.textContent = "Подключение сохранено и относится только к выбранному workspace";
    // подгружаем openapi
    await loadOpenapi(workspaceId);
    updateConnectionSummary();
    renderWorkspaceStats();
  } catch (err) {
    connectionStatus.textContent = err.message;
    renderWorkspaceStats();
  }
}

if (connectionForm) {
  connectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentWorkspaceId) {
      connectionStatus.textContent = "Сначала выберите рабочее пространство";
      return;
    }

    const idAuthType = Number(connectionAuthType?.value || 1);
    updateAuthVisibility(idAuthType);
    const baseUrl = connectionBaseUrl?.value.trim() || "";
    const auth_data = buildAuthData(idAuthType);

    if (idAuthType === 1) {
      if (!auth_data.username || !auth_data.password) {
        showInfoModal("Для Basic укажите и логин, и пароль.");
        return;
      }
    }

    const payload = { id_auth_type: idAuthType, base_url: baseUrl, auth_data };
    const endpoint = currentConnectionId
      ? `/connections/${currentWorkspaceId}/modify`
      : "/connections";

    const method = currentConnectionId ? "PATCH" : "POST";
    const body = currentConnectionId
      ? JSON.stringify(payload)
      : JSON.stringify({ ...payload, id_workspace: currentWorkspaceId });

    try {
      await api(endpoint, { method, body });
      connectionStatus.textContent = "Сохранено";
      await loadConnections(currentWorkspaceId, connectionWorkspaceLabel?.textContent);
    } catch (err) {
      connectionStatus.textContent = err.message;
    }
  });
}

if (deleteConnectionBtn) {
  deleteConnectionBtn.addEventListener("click", async () => {
    if (!currentConnectionId) return;
    cacheDeleteModalElements();
    if (!deleteModal || !deleteModalConfirm || !deleteModalCancel || !deleteModalText) return;

    deleteModalText.textContent = "Удалить подключение? Это действие нельзя отменить.";
    deleteModal.dataset.connectionId = currentConnectionId;
    deleteModal.classList.add("active");

    const closeModal = () => {
      deleteModal.classList.remove("active");
      deleteModal.dataset.connectionId = "";
      deleteModalConfirm.onclick = null;
      deleteModalCancel.onclick = null;
    };

    const onCancel = (e) => {
      e?.preventDefault();
      closeModal();
    };

    const onConfirm = async (e) => {
      e?.preventDefault();
      const targetId = deleteModal.dataset.connectionId;
      if (!targetId) return closeModal();
      deleteModalConfirm.disabled = true;
      try {
        await api(`/connections/${targetId}`, { method: "DELETE" });
        currentConnectionId = null;
        connectionStatus.textContent = "Удалено";
        if (connectionCurrent) connectionCurrent.textContent = "Нет сохраненного подключения";
        connectionLastData = null;
        updateConnectionSummary();
        await loadConnections(currentWorkspaceId, connectionWorkspaceLabel?.textContent);
      } catch (err) {
        connectionStatus.textContent = err.message;
      } finally {
        deleteModalConfirm.disabled = false;
        closeModal();
      }
    };

    deleteModalCancel.onclick = onCancel;
    deleteModalConfirm.onclick = onConfirm;

    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) onCancel(e);
    }, { once: true });
  });
}

async function loadOpenapi(workspaceId) {
  if (!openapiStatus) return;
  try {
    const openapi_schema = await api(`/connections/openapi/${workspaceId}`);
    openapiStatus.textContent = "Схема загружена";
    openapiStatus.className = "pill status-success";
  } catch (err) {
    openapiStatus.textContent = "Схема не загружена";
    openapiStatus.className = "pill status-fail";
  } finally {
    updateConnectionSummary();
    renderWorkspaceStats();
  }
}

let openapiFileContent = null;

if (chooseOpenapiBtn && openapiFile) {
  chooseOpenapiBtn.addEventListener("click", () => openapiFile.click());
  openapiFile.addEventListener("change", () => {
    const file = openapiFile.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        openapiFileContent = JSON.parse(reader.result);
        openapiStatus.textContent = `Файл загружен: ${file.name}`;
      } catch (e) {
        openapiStatus.textContent = "Некорректный JSON в файле";
        openapiFileContent = null;
      }
    };
    reader.readAsText(file);
  });
}

if (uploadOpenapiBtn) {
  uploadOpenapiBtn.addEventListener("click", async () => {
    if (!currentWorkspaceId) return showInfoModal("Сначала выберите workspace");
    if (!openapiFileContent) return showInfoModal("Сначала выберите JSON-файл OpenAPI");
    uploadOpenapiBtn.disabled = true;
    try {
      await api(`/connections/openapi/${currentWorkspaceId}`, {
        method: "PUT",
        body: JSON.stringify({ openapi_schema: openapiFileContent })
      });
      openapiStatus.textContent = "Сохранено";
      openapiStatus.className = "pill status-success";
      renderWorkspaceStats();
      showInfoModal("OpenAPI сохранён");
    } catch (err) {
      showInfoModal(err.message || "Не удалось сохранить OpenAPI");
    } finally {
      uploadOpenapiBtn.disabled = false;
    }
  });
}

if (deleteOpenapiBtn) {
  deleteOpenapiBtn.addEventListener("click", async () => {
    if (!currentWorkspaceId) return;
    deleteOpenapiBtn.disabled = true;
    try {
      await api(`/connections/openapi/${currentWorkspaceId}`, { method: "DELETE" });
      openapiStatus.textContent = "Схема удалена";
      openapiStatus.className = "pill status-fail";
      openapiFileContent = null;
      renderWorkspaceStats();
      if (openapiFile) openapiFile.value = "";
    } catch (err) {
      showInfoModal(err.message || "Не удалось удалить OpenAPI");
    } finally {
      deleteOpenapiBtn.disabled = false;
    }
  });
}

function applyTheme(theme) {
  const normalized = theme === "light" ? "light" : "dark";
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${normalized}`);
  localStorage.setItem("theme", normalized);

  if (themeSelect && themeSelect.value !== normalized) {
    themeSelect.value = normalized;
  }

  const sidebarLogo = document.querySelector(".sidebar-logo img");
  if (sidebarLogo) {
    sidebarLogo.src = normalized === "light"
      ? "img/istok_logo.jpg"
      : "img/istok_light_logo.jpg";
  }

  const loginLogo = document.querySelector(".login-logo");
  if (loginLogo) {
    loginLogo.src = normalized === "light"
      ? "img/istok_logo.jpg"
      : "img/istok_light_logo.jpg";
  }
}

applyTheme(localStorage.getItem("theme") || "dark");

if (themeSelect) {
  themeSelect.addEventListener("change", (e) => {
    applyTheme(e.target.value);
  });
}

if (checkConnectionBtn) {
  checkConnectionBtn.addEventListener("click", async () => {
    if (!currentWorkspaceId) return showInfoModal("Сначала выберите workspace");
    connectionStatus.textContent = "Проверяю подключение...";
    checkConnectionBtn.disabled = true;
    try {
      const res = await api(`/connections/check/${currentWorkspaceId}`);
      if (res.connected) {
        connectionStatus.textContent = "Подключение установлено";
        showInfoModal("Подключение установлено");
      } else {
        const suffix = res.status_code ? ` (HTTP ${res.status_code})` : "";
        connectionStatus.textContent = `Нет подключения${suffix}`;
        showInfoModal(`Нет подключения${suffix}${res.detail ? `: ${res.detail}` : ""}`);
      }
    } catch (err) {
      connectionStatus.textContent = `Нет подключения: ${err.message}`;
      showInfoModal(`Нет подключения: ${err.message}`);
    } finally {
      checkConnectionBtn.disabled = false;
    }
  });
}

if (connectionCompactToggle && connectionPanel) {
  connectionCompactToggle.addEventListener("click", () => {
    togglePanelCompact(connectionPanel, connectionCompactToggle);
  });
}

if (membersCompactToggle && membersPanel) {
  membersCompactToggle.addEventListener("click", () => {
    togglePanelCompact(membersPanel, membersCompactToggle);
  });
}

function openTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("active");
}

const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarToggleIcon = document.getElementById("sidebarToggleIcon");


function updateSidebarToggleIcon(isCollapsed) {
  if (!sidebarToggleIcon || !sidebarToggle) return;
  sidebarToggleIcon.src = isCollapsed
    ? "img/icons/ArrowRightOutline.svg"
    : "img/icons/ArrowLeftOutline.svg";
  sidebarToggle.setAttribute(
    "aria-label",
    isCollapsed ? "Показать меню" : "Скрыть меню"
  );
}

function applySidebarState(collapsed) {
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed", collapsed);
  updateSidebarToggleIcon(collapsed);
}

if (sidebar && sidebarToggle) {
  const savedState = localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  applySidebarState(savedState);

  sidebarToggle.addEventListener("click", () => {
    const nextState = !sidebar.classList.contains("collapsed");
    applySidebarState(nextState);
    localStorage.setItem(SIDEBAR_STATE_KEY, nextState ? "1" : "0");
  });
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}

if (workspaceLogHistoryModal && workspaceLogHistoryClose) {
  workspaceLogHistoryClose.onclick = () => {
    workspaceLogHistoryModal.classList.remove("active");
  };
  workspaceLogHistoryModal.addEventListener("click", (e) => {
    if (e.target === workspaceLogHistoryModal) {
      workspaceLogHistoryModal.classList.remove("active");
    }
  });
}

if (typeof CodeMirror === "undefined") {
  window.CodeMirror = {
    fromTextArea: (textarea) => ({
      getValue: () => textarea.value,
      setValue: (value) => { textarea.value = value; },
      setSize: (width, height) => {
        textarea.style.display = "block";
        textarea.style.width = width;
        textarea.style.height = height;
      },
    }),
  };
}

async function bootstrapScenarioPage() {
  const { workspace, id } = getParams();
  const workspaceId = Number(workspace);
  const scenarioId = Number(id);
  if (!workspaceId || !scenarioId) {
    showInfoModal("Не переданы параметры сценария");
    return;
  }

  const backBtn = document.getElementById("backToWorkspace");
  if (backBtn) backBtn.addEventListener("click", () => window.location.href = `workspace.html?id=${workspaceId}`);

  const editBtn = document.getElementById("editScenarioBtn");
  const editPanel = document.getElementById("scenarioEditPanel");
  const editForm = document.getElementById("scenarioEditForm");
  const editName = document.getElementById("scenarioEditName");
  const editJson = document.getElementById("scenarioEditJson");
  const editStatus = document.getElementById("scenarioEditStatus");
  const editCancel = document.getElementById("scenarioEditCancel");
  const scenarioContent = document.getElementById("scenarioContent");
  const scenarioMeta = document.getElementById("scenarioMeta");
  let editEditor = null;
  let canEdit = true;
  let draftControls = null;

  const initEditEditor = (content) => {
    if (!editJson) return null;
    if (!editEditor) {
      if (typeof CodeMirror === "undefined") {
        showInfoModal("Редактор не загрузился");
        return null;
      }
      editEditor = CodeMirror.fromTextArea(editJson, {
        mode: { name: "javascript", json: true },
        theme: "material",
        lineNumbers: true,
        tabSize: 2,
        indentUnit: 2,
        smartIndent: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        viewportMargin: Infinity,
      });
      editEditor.setSize("100%", "60vh");
    }
    if (typeof content === "string") {
      editEditor.setValue(content);
    }
    return editEditor;
  };

  try {
    // определяем права доступа для workspace
    try {
      const workspaces = await api("/workspaces");
      const ws = workspaces.find((w) => w.id_workspace === workspaceId);
      if (ws && (ws.name_access_type || "").toLowerCase() === "viewer") {
        canEdit = false;
        if (editBtn) editBtn.style.display = "none";
      }
    } catch (_) {}

    const data = await api(`/scenarios/${workspaceId}/detail/${scenarioId}`);
    const scenarioTitle = document.getElementById("scenarioTitle");
    if (scenarioTitle) scenarioTitle.textContent = data.name_scenario || "Без имени";
    if (scenarioMeta) scenarioMeta.textContent = `Workspace #${workspaceId}`;
    if (scenarioContent) scenarioContent.textContent = JSON.stringify(data.content_scenario, null, 2);

    if (editBtn && editPanel && editForm && editName && editJson) {
      const savedDraft = loadScenarioDraft(workspaceId, scenarioId);
      if (!canEdit) {
        editBtn.style.display = "none";
      } else {
        editBtn.style.display = "inline-flex";
        editBtn.onclick = () => {
          editPanel.style.display = "block";
          if (scenarioContent) scenarioContent.style.display = "none";
          if (scenarioMeta) scenarioMeta.style.display = "none";
          editBtn.style.display = "none";
          editName.value = data.name_scenario || "";
          initEditEditor(JSON.stringify(data.content_scenario || {}, null, 2));
          if (editStatus) editStatus.textContent = "Редактируйте и сохраните";
          if (draftControls) draftControls.destroy();
          draftControls = bindScenarioDraftAutosave(workspaceId, scenarioId, editName, editEditor, editStatus);
        };
      }

      if (editCancel) {
        editCancel.onclick = (e) => {
          e.preventDefault();
          editPanel.style.display = "none";
          if (scenarioContent) scenarioContent.style.display = "block";
          if (scenarioMeta) scenarioMeta.style.display = "block";
          if (editBtn) editBtn.style.display = "inline-flex";
        };
      }

      if (savedDraft && canEdit) {
        editPanel.style.display = "block";
        if (scenarioContent) scenarioContent.style.display = "none";
        if (scenarioMeta) scenarioMeta.style.display = "none";
        editBtn.style.display = "none";
        editName.value = savedDraft.name || data.name_scenario || "";
        initEditEditor(savedDraft.content || JSON.stringify(data.content_scenario || {}, null, 2));
        if (editStatus) editStatus.textContent = "Восстановлен локальный черновик";
        if (draftControls) draftControls.destroy();
        draftControls = bindScenarioDraftAutosave(workspaceId, scenarioId, editName, editEditor, editStatus);
      }

      editForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) {
          return showInfoModal("У вас нет прав для изменения сценария");
        }
        let content = {};
        const editorInstance = initEditEditor();
        try {
          const raw = editorInstance ? editorInstance.getValue() : (editJson.value || "{}");
          content = raw ? JSON.parse(raw) : {};
        } catch (err) {
          if (editStatus) {
            editStatus.textContent = "Ошибка: " + err.message;
            editStatus.classList.add("error");
          }
          return;
        }
        const name = editName.value.trim();
        if (editStatus) editStatus.textContent = "Сохраняю...";
        try {
          await api(`/scenarios/${workspaceId}/${scenarioId}`, {
            method: "PATCH",
            body: JSON.stringify({ name_scenario: name || null, content_scenario: content })
          });
          clearScenarioDraft(workspaceId, scenarioId);
          if (draftControls) draftControls.destroy();
          if (editStatus) {
            editStatus.textContent = "Обновлено";
            editStatus.classList.remove("error");
          }
          if (scenarioContent) scenarioContent.textContent = JSON.stringify(content, null, 2);
          if (scenarioTitle && name) scenarioTitle.textContent = name;
          showInfoModal("Сценарий обновлен");
          editPanel.style.display = "none";
          if (scenarioContent) scenarioContent.style.display = "block";
          if (scenarioMeta) scenarioMeta.style.display = "block";
          if (editBtn) editBtn.style.display = "inline-flex";
        } catch (err) {
          if (editStatus) editStatus.textContent = err.message;
        }
      };
    }
  } catch (err) {
    showInfoModal(err.message || "Не удалось загрузить сценарий");
  }
}

async function bootstrapScenarioCreatePage() {
  const { workspace } = getParams();
  const workspaceId = Number(workspace);
  const draftScenarioId = "new";
  const defaultScenarioTemplate = JSON.stringify({
    "Your endpoint": {
      "PRESET": {},
      "TESTS": {},
      "AFTER-TEST": {}
    }
  }, null, 2);
  if (!workspaceId) {
    showInfoModal("Не передан workspace");
    return;
  }
  if (typeof CodeMirror === "undefined") {
    showInfoModal("CodeMirror не загрузился");
    return;
  }
  console.log("Init CodeMirror create page");

  const backBtn = document.getElementById("backToWorkspaceFromCreate");
  if (backBtn) backBtn.onclick = () => window.location.href = `workspace.html?id=${workspaceId}`;
  if (createPageCancel) createPageCancel.onclick = (e) => { e.preventDefault(); window.location.href = `workspace.html?id=${workspaceId}`; };

  if (!jsonEditorEl) {
    showInfoModal("Не найден редактор");
    return;
  }

  const editor = CodeMirror.fromTextArea(jsonEditorEl, {
    mode: { name: "javascript", json: true },
    theme: "material",
    lineNumbers: true,
    tabSize: 2,
    indentUnit: 2,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    viewportMargin: Infinity,
  });

  editor.setSize("100%", "70vh");
  const savedDraft = loadScenarioDraft(workspaceId, draftScenarioId);
  if (savedDraft?.content) {
    editor.setValue(savedDraft.content);
    if (createPageName && savedDraft.name) createPageName.value = savedDraft.name;
    if (createPageStatus) createPageStatus.textContent = "Восстановлен локальный черновик";
  } else if (!editor.getValue().trim() || editor.getValue().trim() === "{\n  \n}") {
    editor.setValue(defaultScenarioTemplate);
  }

  const draftControls = bindScenarioDraftAutosave(workspaceId, draftScenarioId, createPageName, editor, createPageStatus);

  if (createPageValidate) {
    createPageValidate.onclick = (e) => {
      e.preventDefault();
      try { JSON.parse(editor.getValue()); showInfoModal("JSON валиден"); }
      catch (err) { showInfoModal("Ошибка: " + err.message); }
    };
  }

  if (createPageFormat) {
    createPageFormat.onclick = (e) => {
      e.preventDefault();
      try {
        const parsed = JSON.parse(editor.getValue());
        editor.setValue(JSON.stringify(parsed, null, 2));
      } catch (err) { showInfoModal("Неверный JSON: " + err.message); }
    };
  }

  if (createPageForm) {
    createPageForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!createPageName) return;
      const name = createPageName.value.trim();
      if (!name) return showInfoModal("Введите название сценария");
      let content = {};
      try { content = JSON.parse(editor.getValue() || "{}"); }
      catch (err) { return showInfoModal("Неверный JSON: " + err.message); }
      if (createPageSave) createPageSave.disabled = true;
      try {
        await api(`/scenarios/${workspaceId}`, {
          method: "POST",
          body: JSON.stringify({ name_scenario: name, content_scenario: content })
        });
        clearScenarioDraft(workspaceId, draftScenarioId);
        draftControls.destroy();
        window.location.href = `workspace.html?id=${workspaceId}`;
      } catch (err) {
        showInfoModal(err.message);
      } finally {
        if (createPageSave) createPageSave.disabled = false;
      }
    };
  }
}

const currentPath = window.location.pathname;

if (currentPath.includes("dashboard")) {
  ensureAuth().then((ok) => {
    if (!ok) return;
    const hashTab = window.location.hash?.replace("#", "");
    if (hashTab && document.getElementById(hashTab)) {
      openTab(hashTab);
    }
    loadWorkspaces();
  });
} else if (currentPath.includes("workspace")) {
  ensureAuth().then((ok) => {
    if (!ok) return;
    updateAuthVisibility(1);
    initDeleteWorkspaceButton();
    initDeleteModal();
    bootstrapWorkspacePage();
  });
} else if (currentPath.includes("scenario_create")) {
  ensureAuth().then((ok)=>{ if(!ok) return; applyTheme(localStorage.getItem("theme")||"dark"); bootstrapScenarioCreatePage(); });
} else if (currentPath.includes("scenario.html") || currentPath.includes("scenario")) {
  ensureAuth().then((ok) => {
    if (!ok) return;
    applyTheme(localStorage.getItem("theme") || "dark");
    bootstrapScenarioPage();
  });
} else if (currentPath.includes("test.html") || currentPath.includes("test")) {
  ensureAuth().then((ok) => {
    if (!ok) return;
    applyTheme(localStorage.getItem("theme") || "dark");
    bootstrapTestPage();
  });
}
