
"use strict";

/** @typedef {{ key: string, altText: string }} AnalysisImage */
/**
 * @typedef {Object} Analysis
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string} summary
 * @property {string} content
 * @property {string} videoUrl
 * @property {string} status
 * @property {AnalysisImage[]} images
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} publishedAt
 */

// IMPORTANT: Confirm this is the exact URL Netlify assigns your site.
const API_BASE = "https://dreamverse-market-analysis-api.netlify.app";

const TOKEN_KEY = "dreamverse_admin_token";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGES = 20;

const $ = (selector) => document.querySelector(selector);

const loginSection = $("#login-section");
const dashboardSection = $("#dashboard-section");
const loginForm = $("#login-form");
const analysisForm = $("#analysis-form");
const passwordInput = $("#admin-password");
const loginMessage = $("#login-message");
const dashboardMessage = $("#dashboard-message");
const analysisList = $("#analysis-list");
const imageInput = $("#analysis-images");
const imageList = $("#image-list");

let token = sessionStorage.getItem(TOKEN_KEY) || "";
let currentImages = [];
let analyses = [];
let busy = false;

const requiredElements = [
  loginSection,
  dashboardSection,
  loginForm,
  analysisForm,
  passwordInput,
  loginMessage,
  dashboardMessage,
  analysisList,
  imageInput,
  imageList
];

if (requiredElements.some((element) => !element)) {
  throw new Error(
    "DREAMVERSE admin HTML is missing one or more required element IDs."
  );
}

const yearElement = $("#current-year");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

function showMessage(element, message, type = "") {
  if (!element) return;

  element.textContent = message;
  element.dataset.type = type;
}

function setButtonDisabled(selector, disabled) {
  const button = $(selector);
  if (button) button.disabled = disabled;
}

function setBusy(value) {
  busy = value;

  [
    "#logout-button",
    "#new-analysis-button",
    "#save-draft-button",
    "#publish-button",
    "#refresh-button"
  ].forEach((selector) => setButtonDisabled(selector, value));

  analysisList.querySelectorAll("button").forEach((button) => {
    button.disabled = value;
  });
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isLogin = path === "/api/admin/login";

  if (token && !isLogin) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set(
      "Content-Type",
      isLogin ? "text/plain;charset=UTF-8" : "application/json"
    );
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    console.error("DREAMVERSE API connection error:", error);

    throw new Error(
      "Cannot connect to the backend. Check the Netlify URL, deployment status, and browser console."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    console.error(
      "DREAMVERSE API returned a non-JSON response:",
      response.status
    );

    throw new Error(
      `The backend returned an unexpected response (HTTP ${response.status}).`
    );
  }

  if (response.status === 401 && !isLogin) {
    logout(false);
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed (HTTP ${response.status}).`
    );
  }

  return data;
}

function showLoggedOut() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;

  const logoutButton = $("#logout-button");
  if (logoutButton) logoutButton.hidden = true;
}

function showLoggedIn() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;

  const logoutButton = $("#logout-button");
  if (logoutButton) logoutButton.hidden = false;
}

function logout(showNotice = true) {
  token = "";
  sessionStorage.removeItem(TOKEN_KEY);
  currentImages = [];
  analyses = [];

  showLoggedOut();
  resetEditor();

  if (showNotice) {
    showMessage(loginMessage, "You have been signed out.", "success");
  }
}

function resetEditor() {
  analysisForm.reset();

  $("#analysis-id").value = "";
  $("#editor-heading").textContent = "Write an analysis";
  $("#editor-status").textContent = "New draft";

  currentImages = [];
  imageInput.value = "";

  renderImages();
  showMessage(dashboardMessage, "");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (busy) return;

  const password = passwordInput.value;
  if (!password) return;

  setBusy(true);
  showMessage(loginMessage, "Signing in...");

  try {
    const result = await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });

    if (!result?.token) {
      throw new Error("The server did not return a login token.");
    }

    token = result.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    passwordInput.value = "";

    showLoggedIn();

    await loadAnalyses();

    showMessage(loginMessage, "");
  } catch (error) {
    console.error("DREAMVERSE login failed:", error);

    showMessage(
      loginMessage,
      error instanceof Error ? error.message : "Login failed.",
      "error"
    );
  } finally {
    setBusy(false);
  }
});

const newButton = $("#new-analysis-button");
if (newButton) {
  newButton.addEventListener("click", () => {
    if (busy) return;

    resetEditor();
    $("#analysis-title").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const logoutButton = $("#logout-button");
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    if (!busy) logout();
  });
}

const refreshButton = $("#refresh-button");
if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    if (busy) return;

    setBusy(true);

    try {
      await loadAnalyses();
      showMessage(dashboardMessage, "Analysis list refreshed.", "success");
    } catch (error) {
      showMessage(
        dashboardMessage,
        error instanceof Error ? error.message : "Refresh failed.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  });
}

imageInput.addEventListener("change", () => {
  try {
    validateSelectedFiles();
    renderImages();
  } catch (error) {
    imageInput.value = "";

    showMessage(
      dashboardMessage,
      error instanceof Error ? error.message : "Invalid image selection.",
      "error"
    );

    renderImages();
  }
});

function validateSelectedFiles() {
  const files = Array.from(imageInput.files || []);

  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error(`${file.name}: only JPG, PNG, and WebP are allowed.`);
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      throw new Error(`${file.name}: images must be no larger than 8 MB.`);
    }
  }

  if (currentImages.length + files.length > MAX_IMAGES) {
    throw new Error(`You can attach up to ${MAX_IMAGES} images per analysis.`);
  }
}

function renderImages() {
  imageList.replaceChildren();

  currentImages.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "image-item";

    const label = document.createElement("span");
    label.textContent =
      image.altText || image.key.split("/").pop() || "Saved image";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button-outline";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${label.textContent}`);

    remove.addEventListener("click", () => {
      if (busy) return;

      currentImages.splice(index, 1);
      renderImages();
    });

    item.append(label, remove);
    imageList.append(item);
  });

  Array.from(imageInput.files || []).forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "image-item";

    const label = document.createElement("span");
    label.textContent = `Ready to upload: ${file.name}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button-outline";
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      if (busy) return;

      const transfer = new DataTransfer();
      Array.from(imageInput.files || []).forEach((selectedFile, fileIndex) => {
        if (fileIndex !== index) transfer.items.add(selectedFile);
      });

      imageInput.files = transfer.files;
      renderImages();
    });

    item.append(label, remove);
    imageList.append(item);
  });
}

function normalizeImage(image) {
  return {
    key: image?.key || "",
    altText: image?.altText || image?.alt_text || ""
  };
}

function normalizeAnalysis(analysis) {
  return {
    id: analysis?.id || "",
    title: analysis?.title || "",
    category: analysis?.category || analysis?.market || "Forex",
    summary: analysis?.summary || "",
    content: analysis?.content || "",
    videoUrl: analysis?.videoUrl || analysis?.video_url || "",
    status: analysis?.status || "draft",
    images: Array.isArray(analysis?.images)
      ? analysis.images
          .map(normalizeImage)
          .filter((image) => Boolean(image.key))
      : [],
    createdAt: analysis?.createdAt || analysis?.created_at || "",
    updatedAt: analysis?.updatedAt || analysis?.updated_at || "",
    publishedAt: analysis?.publishedAt || analysis?.published_at || ""
  };
}

async function loadAnalyses() {
  const result = await apiRequest("/api/admin/analyses");

  analyses = Array.isArray(result.analyses)
    ? result.analyses.map(normalizeAnalysis)
    : [];

  renderAnalyses();
}

function renderAnalyses() {
  analysisList.replaceChildren();

  if (!analyses.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No analyses yet. Create your first analysis above.";
    analysisList.append(empty);
    return;
  }

  analyses.forEach((analysis) => {
    const card = document.createElement("article");
    card.className = "analysis-item";

    const title = document.createElement("h3");
    title.textContent = analysis.title;

    const meta = document.createElement("p");
    meta.className = "analysis-meta";
    meta.textContent = [
      analysis.category,
      analysis.status === "published" ? "Published" : "Draft",
      `${analysis.images.length} image(s)`
    ].join(" · ");

    const actions = document.createElement("div");
    actions.className = "analysis-actions";

    actions.append(
      createActionButton("Edit", "edit", analysis.id, "button button-outline")
    );

    if (analysis.status === "published") {
      actions.append(
        createActionButton(
          "Unpublish",
          "unpublish",
          analysis.id,
          "button button-outline"
        )
      );
    } else {
      actions.append(
        createActionButton(
          "Publish",
          "publish",
          analysis.id,
          "button button-primary"
        )
      );
    }

    actions.append(
      createActionButton(
        "Delete",
        "delete",
        analysis.id,
        "button button-outline"
      )
    );

    card.append(title, meta, actions);
    analysisList.append(card);
  });
}

function createActionButton(label, action, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function fillEditor(analysis) {
  const item = normalizeAnalysis(analysis);

  resetEditor();

  $("#analysis-id").value = item.id;
  $("#analysis-title").value = item.title;
  $("#analysis-category").value = item.category;
  $("#analysis-summary").value = item.summary;
  $("#analysis-content").value = item.content;
  $("#analysis-video").value = item.videoUrl;

  $("#editor-heading").textContent = "Edit analysis";
  $("#editor-status").textContent =
    item.status === "published" ? "Published" : "Draft";

  currentImages = item.images.slice();
  renderImages();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function uploadSelectedImages() {
  const files = Array.from(imageInput.files || []);

  validateSelectedFiles();

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    const result = await apiRequest("/api/admin/upload", {
      method: "POST",
      body: formData
    });

    if (!result?.key) {
      throw new Error(`The upload response for ${file.name} was incomplete.`);
    }

    currentImages.push({
      key: result.key,
      altText: result.altText || file.name
    });
  }

  imageInput.value = "";
  renderImages();
}

function readEditor(status) {
  return {
    title: $("#analysis-title").value.trim(),
    category: $("#analysis-category").value,
    summary: $("#analysis-summary").value.trim(),
    content: $("#analysis-content").value.trim(),
    videoUrl: $("#analysis-video").value.trim(),
    status,
    images: currentImages.map((image) => ({
      key: image.key,
      altText: image.altText || ""
    }))
  };
}

async function saveAnalysis(status) {
  if (busy || !analysisForm.reportValidity()) return;

  setBusy(true);
  showMessage(dashboardMessage, "Saving your analysis...");

  let createdId = "";

  try {
    let id = $("#analysis-id").value.trim();

    // Validate image selection before creating a new database record.
    validateSelectedFiles();

    if (!id) {
      const payload = readEditor("draft");

      const created = await apiRequest("/api/admin/analyses", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          status: "draft",
          images: []
        })
      });

      id = created?.id || "";

      if (!id) {
        throw new Error("The server did not return the new analysis ID.");
      }

      createdId = id;
      $("#analysis-id").value = id;
    }

    await uploadSelectedImages();

    const payload = readEditor(status);

    await apiRequest(
      `/api/admin/analyses/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload)
      }
    );

    $("#editor-status").textContent =
      status === "published" ? "Published" : "Draft";

    showMessage(
      dashboardMessage,
      status === "published"
        ? "Analysis published successfully."
        : "Draft saved successfully.",
      "success"
    );

    await loadAnalyses();
  } catch (error) {
    console.error("DREAMVERSE analysis save failed:", error);

    const message =
      error instanceof Error ? error.message : "Could not save the analysis.";

    showMessage(
      dashboardMessage,
      createdId
        ? `${message} A draft may already have been created. Check the analysis list before retrying.`
        : message,
      "error"
    );

    // Do not clear uploaded images or form data on failure.
  } finally {
    setBusy(false);
  }
}

const saveDraftButton = $("#save-draft-button");
if (saveDraftButton) {
  saveDraftButton.addEventListener("click", () => {
    saveAnalysis("draft");
  });
}

const publishButton = $("#publish-button");
if (publishButton) {
  publishButton.addEventListener("click", () => {
    saveAnalysis("published");
  });
}

analysisList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("button[data-action]");
  if (!button || busy) return;

  const { action, id } = button.dataset;
  const analysis = analyses.find((item) => item.id === id);

  if (!analysis || !id || !action) {
    showMessage(
      dashboardMessage,
      "That analysis could not be found. Refresh the list.",
      "error"
    );
    return;
  }

  if (action === "edit") {
    fillEditor(analysis);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(
      `Delete "${analysis.title}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setBusy(true);
    showMessage(dashboardMessage, "Deleting analysis...");

    try {
      await apiRequest(
        `/api/admin/analyses/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      if ($("#analysis-id").value === id) {
        resetEditor();
      }

      showMessage(dashboardMessage, "Analysis deleted.", "success");
      await loadAnalyses();
    } catch (error) {
      showMessage(
        dashboardMessage,
        error instanceof Error ? error.message : "Deletion failed.",
        "error"
      );
    } finally {
      setBusy(false);
    }

    return;
  }

  if (action === "publish" || action === "unpublish") {
    const nextStatus = action === "publish" ? "published" : "draft";

    const confirmed = window.confirm(
      nextStatus === "published"
        ? `Publish "${analysis.title}" so visitors can see it?`
        : `Unpublish "${analysis.title}" and remove it from the public listing?`
    );

    if (!confirmed) return;

    setBusy(true);
    showMessage(dashboardMessage, "Updating publication status...");

    try {
      await apiRequest(
        `/api/admin/analyses/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: analysis.title,
            category: analysis.category,
            summary: analysis.summary,
            content: analysis.content,
            videoUrl: analysis.videoUrl,
            status: nextStatus,
            images: analysis.images
          })
        }
      );

      showMessage(
        dashboardMessage,
        nextStatus === "published"
          ? "Analysis published."
          : "Analysis unpublished.",
        "success"
      );

      await loadAnalyses();
    } catch (error) {
      showMessage(
        dashboardMessage,
        error instanceof Error ? error.message : "Status update failed.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }
});

async function initialize() {
  if (!token) {
    showLoggedOut();
    return;
  }

  showLoggedIn();
  setBusy(true);

  try {
    await loadAnalyses();
  } catch (error) {
    logout(false);

    showMessage(
      loginMessage,
      error instanceof Error
        ? error.message
        : "Your session could not be restored. Please sign in again.",
      "error"
    );
  } finally {
    setBusy(false);
  }
}

initialize();
  
