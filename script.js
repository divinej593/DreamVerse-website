document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     DREAMVERSE — MAIN JAVASCRIPT
  ========================================= */

  /* =========================================
     MOBILE NAVIGATION
  ========================================= */

  const hamburger = document.querySelector(".hamburger");
  const mainNavigation = document.querySelector(".main-navigation");
  const navActions = document.querySelector(".nav-actions");
  const navigation = document.querySelector("nav");

  if (hamburger && mainNavigation && navActions && navigation) {
    const mobileBreakpoint = 900;

    const setMenuState = (isOpen = false) => {
      hamburger.classList.toggle("is-open", isOpen);
      mainNavigation.classList.toggle("is-open", isOpen);
      navActions.classList.toggle("is-open", isOpen);
      navigation.classList.toggle("menu-open", isOpen);

      hamburger.setAttribute("aria-expanded", String(isOpen));
      hamburger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    };

    hamburger.setAttribute("aria-expanded", "false");

    /* Open / close menu */
    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.classList.contains("is-open");
      setMenuState(!isOpen);
    });

    /* Close menu when navigation link is clicked */
    const navigationLinks = mainNavigation.querySelectorAll("a");

    navigationLinks.forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    /* Close menu when action button is clicked */
    const actionLinks = navActions.querySelectorAll("a");

    actionLinks.forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    /* Close menu when clicking outside the navigation */
    document.addEventListener("click", (event) => {
      if (
        hamburger.classList.contains("is-open") &&
        !navigation.contains(event.target)
      ) {
        setMenuState(false);
      }
    });

    /* Close menu with Escape */
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuState(false);
        hamburger.focus();
      }
    });

    /* Reset mobile menu when switching to desktop */
    window.addEventListener("resize", () => {
      if (window.innerWidth >= mobileBreakpoint) {
        setMenuState(false);
      }
    });
  }

  /* =========================================
     SECRET COMMUNITY MESSAGE
  ========================================= */

  const secretTrigger = document.querySelector(".secret-trigger");
  const secretMessage = document.querySelector(".secret-message");

  if (secretTrigger && secretMessage) {
    secretTrigger.setAttribute("aria-expanded", "false");

    const toggleSecretMessage = () => {
      const isHidden = secretMessage.hidden;

      secretMessage.hidden = !isHidden;
      secretTrigger.setAttribute("aria-expanded", String(isHidden));
    };

    secretTrigger.addEventListener("click", toggleSecretMessage);

    secretTrigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleSecretMessage();
      }
    });
  }

  /* =========================================
     CLOSE SECRET MESSAGE WHEN CLICKING OUTSIDE
  ========================================= */

  if (secretTrigger && secretMessage) {
    document.addEventListener("click", (event) => {
      if (
        !secretMessage.hidden &&
        !secretTrigger.contains(event.target) &&
        !secretMessage.contains(event.target)
      ) {
        secretMessage.hidden = true;
        secretTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================
     INTERNAL ANCHOR LINKS
  ========================================= */

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (!targetElement) {
        return;
      }

      event.preventDefault();

      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      /* Update browser URL without jumping */
      history.replaceState(null, "", targetId);
    });
  });

  /* =========================================
     ACCESSIBILITY — KEYBOARD FOCUS
  ========================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      document.body.classList.add("keyboard-navigation");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-navigation");
  });

  /* =========================================
     EXTERNAL LINKS
  ========================================= */

  const externalLinks = document.querySelectorAll('a[target="_blank"]');

  externalLinks.forEach((link) => {
    link.setAttribute("rel", "noopener noreferrer");
  });

  /* =========================================
     PAGE LOAD
  ========================================= */

  document.body.classList.add("js-loaded");
});
