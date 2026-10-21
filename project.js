"use strict";

/* ========================================
DREAMVERSE PROJECT CONFIGURATION
======================================== */

/**

* @typedef {Object} Project
* @property {boolean} published
* @property {string} name
* @property {string} category
* @property {string} status
* @property {string} description
* @property {string} artwork
* @property {string} artworkAlt
* @property {string[]} about
* @property {string[]} information
* @property {string} guideIntro
* @property {string[]} guide
* @property {string} participationLink
* @property {string} xLink
* @property {string} disclaimer
  */

/** @type {Record<string, Project>} */
const PROJECTS = {
"project-01": {
published: true,
name: "Dreamoni",
category: "Web3",
status: "Ongoing",
description: "Discover this project and learn what it offers.",
artwork: "assets/discover/project-01.jpg",
artworkAlt: "Featured project artwork",
about: [
"Add a clear explanation of what this project does.",
"Explain its main features, purpose, and why it may interest visitors."
],
information: [
"Opportunity: Add the confirmed opportunity type.",
"Participation cost: Confirm whether fees are required.",
"Reward status: Confirmed, unconfirmed, or not applicable.",
"Deadline: Add the official deadline or state that it has not been announced."
],
guideIntro: "Review the official requirements before participating.",
guide: [
"Visit the official participation website.",
"Read the eligibility requirements and check any potential costs.",
"Follow the project's official participation instructions.",
"Check official announcements for updates and deadlines."
],
participationLink: "",
xLink: "",
disclaimer:
"DREAMVERSE shares project information for educational purposes. Participation may involve risks, and rewards or profits are never guaranteed."
},

"project-02": {
published: true,
name: "TiledRoad",
category: "Web3",
status: "Upcoming",
description: "Learn about this project and its potential opportunity.",
artwork: "assets/discover/project-02.jpg",
artworkAlt: "Project 02 artwork",
about: [
"Add a factual introduction explaining what the project does.",
"Describe its purpose, important features, and current development stage."
],
information: [
"Opportunity: Add the confirmed opportunity type.",
"Participation cost: Confirm whether fees are required.",
"Reward status: Confirmed, unconfirmed, or not applicable.",
"Deadline: Add the official deadline or state that it has not been announced."
],
guideIntro:
"Check the project's official announcements before taking action.",
guide: [
"Visit the official project website.",
"Check whether participation is currently available.",
"Review the official requirements before completing any tasks.",
"Follow official announcements for launch dates and updates."
],
participationLink: "",
xLink: "",
disclaimer:
"DREAMVERSE shares project information for educational purposes. Participation may involve risks, and rewards or profits are never guaranteed."
}
};

/* ========================================
DOM HELPERS
======================================== */

/** @param {string} id */
function getElement(id) {
return document.getElementById(id);
}

/**

* @param {string} id
* @param {string} value
  */
  function setText(id, value) {
  const element = getElement(id);

if (element) {
element.textContent = value || "";
}
}

/**

* @param {string} id
* @param {string[]} items
  */
  function setParagraphs(id, items) {
  const container = getElement(id);

if (!container) return;

container.replaceChildren();

items.forEach((text) => {
if (typeof text !== "string" || !text.trim()) return;

const paragraph = document.createElement("p");
paragraph.textContent = text;
container.appendChild(paragraph);

});
}

/**

* @param {string} id
* @param {string[]} items
  */
  function setList(id, items) {
  const container = getElement(id);

if (!container) return;

container.replaceChildren();

items.forEach((text) => {
if (typeof text !== "string" || !text.trim()) return;

const item = document.createElement("li");
item.textContent = text;
container.appendChild(item);

});
}

/* ========================================
SAFE PROJECT LINKS
======================================== */

/** @param {string} value */
function isSafeUrl(value) {
try {
const url = new URL(value);

return (
  (url.protocol === "https:" || url.protocol === "http:") &&
  Boolean(url.hostname)
);

} catch {
return false;
}
}

/* ========================================
PROJECT ARTWORK
======================================== */

/** @param {Project} project */
function setArtwork(project) {
const image = getElement("project-image");

if (!image) return;

image.style.display = "block";
image.alt = project.artworkAlt || "${project.name} artwork";

image.onerror = () => {
image.removeAttribute("src");
image.style.display = "none";
};

image.src = project.artwork;
}

/* ========================================
OFFICIAL LINKS
Participation and Project X only
======================================== */

/** @param {Project} project */
function setActions(project) {
const container = getElement("project-actions");
const section = getElement("project-links-section");

if (!container) return;

container.replaceChildren();

const links = [
{
label: "Participation Link",
url: project.participationLink,
primary: true
},
{
label: "Project X",
url: project.xLink,
primary: false
}
];

links.forEach((link) => {
if (!isSafeUrl(link.url)) return;

const button = document.createElement("a");

button.className = link.primary
  ? "project-button primary"
  : "project-button";

button.textContent = link.label;
button.href = link.url;
button.target = "_blank";
button.rel = "noopener noreferrer";

container.appendChild(button);

});

if (section) {
section.hidden = container.children.length === 0;
}
}

/* ========================================
UNAVAILABLE PROJECT
======================================== */

/** @param {string} [message] */
function showUnavailable(message) {
const status = getElement("project-status");
const panel = getElement("project-details");
const unavailable = getElement("project-unavailable");

if (panel) panel.hidden = true;
if (status) status.hidden = true;
if (unavailable) unavailable.hidden = false;

setText(
"unavailable-message",
message || "This project is unavailable. Please return to Discover."
);

document.title = "Project Unavailable | DREAMVERSE";
}

/* ========================================
DISPLAY PROJECT
======================================== */

/** @param {Project} project */
function displayProject(project) {
const status = getElement("project-status");
const panel = getElement("project-details");

if (!status || !panel) {
showUnavailable("The project page could not be loaded correctly.");
return;
}

setText("project-title", project.name);
setText("project-description", project.description);
setText("project-category", project.category);
setText("project-status-label", project.status);
setText("guide-intro", project.guideIntro);
setText("project-disclaimer", project.disclaimer);

const category = getElement("project-category");
const statusLabel = getElement("project-status-label");
const disclaimer = getElement("project-disclaimer");

if (category) category.hidden = !project.category;
if (statusLabel) statusLabel.hidden = !project.status;
if (disclaimer) disclaimer.hidden = !project.disclaimer;

setArtwork(project);
setParagraphs("project-about", project.about);
setParagraphs("project-information", project.information);
setList("project-guide", project.guide);
setActions(project);

const informationSection =
getElement("project-information-section");

if (informationSection) {
informationSection.hidden = project.information.length === 0;
}

document.title = "${project.name} | DREAMVERSE";

panel.hidden = false;
status.hidden = true;
}

/* ========================================
LOAD PROJECT FROM URL
======================================== */

function loadProject() {
const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");
const project = projectId ? PROJECTS[projectId] : undefined;

if (!project || project.published !== true) {
showUnavailable(
"This project is not available yet, or its link is incorrect."
);
return;
}

displayProject(project);
}

/* ========================================
MOBILE NAVIGATION
======================================== */

function initMobileNavigation() {
const toggle = document.querySelector(".menu-toggle");
const navigation = getElement("main-navigation");

if (!toggle || !navigation) return;

/** @param {boolean} isOpen */
function setMenu(isOpen) {
navigation.classList.toggle("is-open", isOpen);
toggle.setAttribute("aria-expanded", String(isOpen));
toggle.setAttribute(
"aria-label",
isOpen ? "Close navigation menu" : "Open navigation menu"
);
}

toggle.addEventListener("click", () => {
setMenu(!navigation.classList.contains("is-open"));
});

navigation.querySelectorAll("a").forEach((link) => {
link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
if (event.key === "Escape") setMenu(false);
});

document.addEventListener("click", (event) => {
const target = event.target;

if (
  target instanceof Node &&
  !navigation.contains(target) &&
  !toggle.contains(target)
) {
  setMenu(false);
}

});

window.addEventListener("resize", () => {
if (window.innerWidth > 700) setMenu(false);
});
}

/* ========================================
INITIALIZE
======================================== */

document.addEventListener("DOMContentLoaded", () => {
initMobileNavigation();
loadProject();

setText("current-year", String(new Date().getFullYear()));
});
