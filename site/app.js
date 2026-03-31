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
const membersList = document.getElementById("membersList");
const memberForm = document.getElementById("memberForm");
const memberUsername = document.getElementById("memberUsername");
const memberAccess = document.getElementById("memberAccess");
const memberStatus = document.getElementById("memberStatus");
const membersPanel = document.getElementById("membersPanel");

let currentWorkspaceId = null;
let currentConnectionId = null;
let currentIsOwner = false;

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
  descr.className = "muted";
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
      if (connectionStatus) connectionStatus.textContent = err.message;
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
    currentIsOwner = ((ws.name_access_type || "").toLowerCase() === "owner");

    await loadConnections(id, ws.name_workspace);
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
    if (!members.length) {
      membersList.innerHTML = "<div class='muted'>Пока никого нет</div>";
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
      membersList.appendChild(item);
    });
  } catch (err) {
    membersList.innerHTML = `<div class='muted'>${err.message}</div>`;
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

  try {
    const list = await api(`/connections/${workspaceId}`);
    const first = list[0];

    if (!first) {
      connectionStatus.textContent = "Подключение еще не настроено для этого workspace";
      if (deleteConnectionBtn) deleteConnectionBtn.disabled = true;
      if (connectionCurrent) connectionCurrent.textContent = "Нет сохраненного подключения";
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

      connectionCurrent.innerHTML = `
        <div><strong>Base URL:</strong> ${first.base_url || "—"}</div>
        <div><strong>Auth:</strong> ${authSummary}</div>
      `;
    }

    connectionStatus.textContent = "Подключение сохранено и относится только к выбранному workspace";
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
    if (!confirm("Удалить подключение?")) return;

    try {
      await api(`/connections/${currentConnectionId}`, { method: "DELETE" });
      currentConnectionId = null;
      connectionStatus.textContent = "Удалено";
      if (connectionCurrent) connectionCurrent.textContent = "Нет сохраненного подключения";
      await loadConnections(currentWorkspaceId, connectionWorkspaceLabel?.textContent);
    } catch (err) {
      connectionStatus.textContent = err.message;
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
}
