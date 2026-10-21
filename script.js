document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     DREAMVERSE — MAIN JAVASCRIPT
     Designed specifically for the current index.html + style.css
     ========================================================= */

  /* =========================================================
     HAMBURGER MENU
     ========================================================= */

  const hamburger = document.querySelector(".hamburger");
  const navigation = document.querySelector(".main-navigation");

  if (hamburger && navigation) {
    /* Open / close menu */

    hamburger.addEventListener("click", (event) => {
      event.stopPropagation();

      const isOpen = navigation.classList.toggle("active");

      hamburger.classList.toggle("active", isOpen);

      hamburger.setAttribute("aria-expanded", String(isOpen));

      hamburger.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu",
      );
    });

    /* =======================================================
       CLOSE MENU AFTER CLICKING A LINK
       ======================================================= */

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("active");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");

        hamburger.setAttribute("aria-label", "Open navigation menu");
      });
    });

    /* =======================================================
       CLOSE MENU WHEN CLICKING OUTSIDE
       ======================================================= */

    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("active") &&
        !navigation.contains(event.target) &&
        !hamburger.contains(event.target)
      ) {
        navigation.classList.remove("active");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");

        hamburger.setAttribute("aria-label", "Open navigation menu");
      }
    });

    /* =======================================================
       CLOSE MENU WHEN RESIZING TO DESKTOP
       ======================================================= */

    window.addEventListener("resize", () => {
      if (window.innerWidth > 850) {
        navigation.classList.remove("active");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");

        hamburger.setAttribute("aria-label", "Open navigation menu");
      }
    });
  }

  /* =========================================================
     HEADER SCROLL EFFECT
     ========================================================= */

  const header = document.querySelector(".site-header");

  if (header) {
    const updateHeader = () => {
      if (window.scrollY > 30) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", updateHeader, { passive: true });

    updateHeader();
  }

  /* =========================================================
     EXTERNAL LINKS
     ========================================================= */

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute("rel", "noopener noreferrer");
  });

  /* =========================================================
     IMAGE ERROR HANDLING
     ========================================================= */

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.classList.add("image-error");
    });
  });

  /* =========================================================
     ESCAPE KEY
     ========================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (navigation && hamburger) {
      navigation.classList.remove("active");
      hamburger.classList.remove("active");

      hamburger.setAttribute("aria-expanded", "false");

      hamburger.setAttribute("aria-label", "Open navigation menu");
    }
  });

  /* =========================================================
     JAVASCRIPT READY
     ========================================================= */

  document.documentElement.classList.add("js-ready");
});
