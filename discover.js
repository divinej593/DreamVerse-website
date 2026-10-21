"use strict";

/* =========================================================
   DREAMVERSE DISCOVER
   Mobile navigation and shared page interactions
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
});

/* ---------- Mobile navigation ---------- */

function initMobileNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector("#main-navigation");

  // Stop safely if the required elements are not present.
  if (!menuToggle || !mainNav) {
    return;
  }

  function isMenuOpen() {
    return menuToggle.getAttribute("aria-expanded") === "true";
  }

  function openMenu() {
    mainNav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
  }

  function closeMenu() {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Open or close the mobile menu.
  menuToggle.addEventListener("click", toggleMenu);

  // Close the menu after a visitor selects a navigation link.
  mainNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (link) {
      closeMenu();
    }
  });

  // Close the menu when Escape is pressed.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // Close the menu when the visitor clicks outside it.
  document.addEventListener("click", (event) => {
    if (!isMenuOpen()) {
      return;
    }

    const clickedInsideMenu = mainNav.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeMenu();
    }
  });

  // Reset mobile navigation when returning to desktop width.
  const desktopMediaQuery = window.matchMedia("(min-width: 701px)");

  /**
   * @param {MediaQueryListEvent} event
   */
  function handleViewportChange(event) {
    if (event.matches) {
      closeMenu();
    }
  }

  desktopMediaQuery.addEventListener("change", handleViewportChange);
}
