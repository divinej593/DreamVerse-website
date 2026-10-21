
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

const API_BASE = "https://dreamverse-analysis-api.divinej593.workers.dev";
const TOKEN_KEY = "dreamverse_admin_token";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

/** @param {string} selector @returns {any} */
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

/** @type {string} */
let token = sessionStorage.getItem(TOKEN_KEY) || "";

/** @type {AnalysisImage[]} */
let currentImages = [];

/** @type {Analysis[]} */
let analyses = [];

let busy = false;

$("#current-year").textContent = String(new Date().getFullYear());

/**
 * @param {HTMLElement} element
 * @param {string} message
 * @param {string} [type]
 */
function showMessage(element, message, type = "") {
  element.textContent = message;
  element.dataset.type = type;
}

/**
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    console.error("DREAMVERSE API connection error:", {
      endpoint: `${API_BASE}${path}`,
      websiteOrigin: window.location.origin,
      error
    });

    const details =
      error instanceof Error ? error.message : String(error);

    throw new Error(
      `API connection failed: ${details}. Check the browser console for details.`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error("DREAMVERSE API response was not valid JSON:", {
      endpoint: `${API_BASE}${path}`,
      status: response.status,
      error
    });

    if (!response.ok) {
      throw new Error(`The server returned HTTP ${response.status}.`);
    }

    throw new Error("The server returned an unexpected response.");
  }

  if (response.status === 401 && path !== "/api/admin/login") {
    logout(false);
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }

  return data;
}

/** @param {boolean} value */
function setBusy(value) {
  busy = value;

  [
    "#logout-button",
    "#new-analysis-button",
    "#save-draft-button",
    "#publish-button",
    "#refresh-button"
  ].forEach((selector) => {
    const button = $(selector);
    if (button) button.disabled = value;
  });
}

function showLoggedOut() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
  $("#logout-button").hidden = true;
}

function showLoggedIn() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  $("#logout-button").hidden = false;
}

/** @param {boolean} [showNotice] */
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

loginForm.addEventListener("submit", async (/** @type {SubmitEvent} */ event) => {
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

    if (!result.token) {
      throw new Error("The server did not return a login token.");
    }

    token = result.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    passwordInput.value = "";

    showLoggedIn();
    showMessage(loginMessage, "");
    await loadAnalyses();
  } catch (/** @type {any} */ error) {
    console.error("DREAMVERSE admin login failed:", error);
    showMessage(
      loginMessage,
      error.message || "Login failed. Please try again.",
      "error"
    );
  } finally {
    setBusy(false);
  }
});

function resetEditor() {
  analysisForm.reset();
  $("#analysis-id").value = "";
  $("#editor-heading").textContent = "Write an analysis";
  $("#editor-status").textContent = "New draft";
  currentImages = [];
  renderImages();
  showMessage(dashboardMessage, "");
}

$("#new-analysis-button").addEventListener("click", () => {
  resetEditor();
  $("#analysis-title").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("#logout-button").addEventListener("click", () => {
  logout();
});

$("#refresh-button").addEventListener("click", async () => {
  if (busy) return;

  setBusy(true);

  try {
    await loadAnalyses();
    showMessage(dashboardMessage, "Analysis list refreshed.", "success");
  } catch (/** @type {any} */ error) {
    showMessage(dashboardMessage, error.message, "error");
  } finally {
    setBusy(false);
  }
});

imageInput.addEventListener("change", renderImages);

function renderImages() {
  imageList.replaceChildren();

  if (!currentImages.length && !imageInput.files.length) {
    return;
  }

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
      currentImages.splice(index, 1);
      renderImages();
    });

    item.append(label, remove);
    imageList.append(item);
  });

  Array.from(imageInput.files).forEach((/** @type {File} */ file) => {
    const item = document.createElement("div");
    item.className = "image-item";

    const label = document.createElement("span");
    label.textContent = `Ready to upload: ${file.name}`;

    item.append(label);
    imageList.append(item);
  });
}

/** @param {any} image @returns {AnalysisImage} */
function normalizeImage(image) {
  return {
    key: image.key || "",
    altText: image.altText || image.alt_text || ""
  };
}

/** @param {any} analysis @returns {Analysis} */
function normalizeAnalysis(analysis) {
  return {
    id: analysis.id || "",
    title: analysis.title || "",
    category: analysis.category || "",
    summary: analysis.summary || "",
    content: analysis.content || "",
    videoUrl: analysis.videoUrl || analysis.video_url || "",
    status: analysis.status || "draft",
    images: Array.isArray(analysis.images)
      ? analysis.images
          .map(normalizeImage)
          .filter((/** @type {AnalysisImage} */ image) => Boolean(image.key))
      : [],
    createdAt: analysis.createdAt || analysis.created_at || "",
    updatedAt: analysis.updatedAt || analysis.updated_at || "",
    publishedAt: analysis.publishedAt || analysis.published_at || ""
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
    empty.textContent =
      "No analyses yet. Create your first analysis above.";
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

/**
 * @param {string} label
 * @param {string} action
 * @param {string} id
 * @param {string} className
 * @returns {HTMLButtonElement}
 */
function createActionButton(label, action, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

/** @param {Analysis} analysis */
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

  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error(`${file.name}: use JPG, PNG, or WebP images.`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`${file.name} is larger than 8 MB.`);
    }
  }

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    const result = await apiRequest("/api/admin/upload", {
      method: "POST",
      body: formData
    });

    if (!result.key) {
      throw new Error(
        `The upload response for ${file.name} was incomplete.`
      );
    }

    currentImages.push({
      key: result.key,
      altText: result.altText || file.name
    });
  }

  imageInput.value = "";
  renderImages();
}

/** @param {string} status */
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

/** @param {"draft"|"published"} status */
async function saveAnalysis(status) {
  if (busy) return;
  if (!analysisForm.reportValidity()) return;

  setBusy(true);
  showMessage(dashboardMessage, "Saving your analysis...");

  try {
    let id = $("#analysis-id").value.trim();
    let payload = readEditor(status);

    if (!id) {
      const created = await apiRequest("/api/admin/analyses", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          status: "draft",
          images: []
        })
      });

      id = created.id;

      if (!id) {
        throw new Error("The server did not return the new analysis ID.");
      }

      $("#analysis-id").value = id;
    }

    await uploadSelectedImages();

    payload = readEditor(status);

    await apiRequest(`/api/admin/analyses/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    showMessage(
      dashboardMessage,
      status === "published"
        ? "Analysis published successfully."
        : "Draft saved successfully.",
      "success"
    );

    $("#editor-status").textContent =
      status === "published" ? "Published" : "Draft";

    await loadAnalyses();
  } catch (/** @type {any} */ error) {
    console.error("DREAMVERSE analysis save failed:", error);
    showMessage(dashboardMessage, error.message, "error");
  } finally {
    setBusy(false);
  }
}

$("#save-draft-button").addEventListener("click", () => {
  saveAnalysis("draft");
});

$("#publish-button").addEventListener("click", () => {
  saveAnalysis("published");
});

analysisList.addEventListener(
  "click",
  async (/** @type {MouseEvent} */ event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest("button[data-action]");
    if (!button || busy) return;

    const { action, id } = /** @type {HTMLButtonElement} */ (button).dataset;
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

        if ($("#analysis-id").value === id) resetEditor();

        showMessage(dashboardMessage, "Analysis deleted.", "success");
        await loadAnalyses();
      } catch (/** @type {any} */ error) {
        showMessage(dashboardMessage, error.message, "error");
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
      } catch (/** @type {any} */ error) {
        showMessage(dashboardMessage, error.message, "error");
      } finally {
        setBusy(false);
      }
    }
  }
);

async function initialize() {
  if (!token) {
    showLoggedOut();
    return;
  }

  showLoggedIn();
  setBusy(true);

  try {
    await loadAnalyses();
  } catch (/** @type {any} */ error) {
    showMessage(dashboardMessage, error.message, "error");
  } finally {
    setBusy(false);
  }
}

initialize();
  
