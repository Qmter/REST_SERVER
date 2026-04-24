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
    if (createScenarioBtn) {
      const canCreate = currentAccessType !== "viewer";
      createScenarioBtn.style.display = canCreate ? "inline-flex" : "none";
      if (canCreate) {
        createScenarioBtn.onclick = () => window.location.href = `scenario_create.html?workspace=${id}`;
      }
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
  } catch (err) {
    scenarioList.innerHTML = `<div class='muted'>${err.message}</div>`;
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

async function loadTests(workspaceId) {
  if (!testList) return;
  testList.innerHTML = "<div class='muted'>Загружаю тесты...</div>";
  try {
    testsCache = await api(`/tests/${workspaceId}`);
    renderTests();
  } catch (err) {
    testList.innerHTML = `<div class='muted'>${err.message}</div>`;
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
    runBtn.textContent = "Запустить";
    runBtn.onclick = async (e) => {
      e.stopPropagation();
      await runTestApi(t.id_test, runBtn);
    };
    actions.append(openBtn, runBtn);
    el.append(actions);

    testList.appendChild(el);
  });
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
    if (testRunLog) testRunLog.textContent = "";
    setInlineRunLogVisible(false);
  });
}

async function runTestApi(testId, btn, workspaceId = currentWorkspaceId, statusEl = null) {
  if (!workspaceId || !testId) return;
  const prevText = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Запуск...";
  }
  if (statusEl) {
    statusEl.style.display = "inline-flex";
    statusEl.className = "badge-soft status-badge status-running";
    statusEl.textContent = "Запуск...";
  }
  console.log(`Running test ${testId} in workspace ${workspaceId}`);
  try {
    const res = await api(`/tests/${workspaceId}/run/${testId}`, { method: "POST" });
    const status = res?.status || "unknown";
    const failedList = res?.failed_indexes || [];
    const failed = failedList.length ? `\nFailed: ${failedList.join(", ")}` : "";
    showInfoModal(`Статус: ${status}${failed}`);
    if (testRunLog && res?.log !== undefined) {
      testRunLog.textContent = res.log || "";
      setInlineRunLogVisible(true);
    }
    if (statusEl) {
      statusEl.className = `badge-soft status-badge ${status === "FAIL" ? "status-fail" : "status-success"}`;
      statusEl.textContent = failedList.length ? `Статус: ${status}, failed: ${failedList.join(", ")}` : `Статус: ${status}`;
    }
    await loadExecutions(workspaceId, testId);
  } catch (err) {
    showInfoModal(err.message || "Ошибка запуска теста");
    if (statusEl) {
      statusEl.className = "badge-soft status-badge status-error";
      statusEl.textContent = "Ошибка запуска";
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevText || "Запустить";
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
  try {
    const data = await api(`/tests/${workspaceId}/detail/${testId}`);
    if (testTitle) testTitle.textContent = data.name_test || `Тест #${data.id_test}`;
    const genAt = data.generated_at ? new Date(data.generated_at).toLocaleString() : "—";
    if (testMeta) testMeta.textContent = `ID: ${data.id_test} · Сценарий: ${data.id_scenario} · Сгенерирован: ${genAt}`;
    if (testContent) renderTestContent(testContent, data.content_test);
    setInlineRunLogVisible(false);
    if (testRunLog) testRunLog.textContent = "";
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

async function loadExecutionLog(workspaceId, execId) {
  if (!executionLogModal || !logModal) return;
  currentExecutionLogId = execId;
  executionLogModal.textContent = "Загружаю лог...";
  logModal.classList.add("active");
  try {
    const res = await api(`/tests/${workspaceId}/executions/log/${execId}`);
    const logText = res?.log ?? JSON.stringify(res, null, 2);
    executionLogModal.textContent = logText;
    if (logDownloadBtn) {
      logDownloadBtn.onclick = () => downloadText(logText, `execution_${execId}.log`);
    }
  } catch (err) {
    executionLogModal.textContent = err.message || "Не удалось загрузить лог";
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
    if (!targetId) return alert("Не удалось определить workspace для удаления");
    if (!currentIsOwner) return alert("Только владелец может удалить workspace");

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
        alert(err.message || "Не удалось удалить");
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
  cacheDeleteModalElements();
  if (!infoModal || !infoModalText || !infoModalClose) return alert(text);
  infoModalText.textContent = text;
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
  } catch (err) {
    connectionStatus.textContent = err.message;
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
  if (!editor.getValue().trim() || editor.getValue().trim() === "{\n  \n}") {
    editor.setValue(defaultScenarioTemplate);
  }

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
