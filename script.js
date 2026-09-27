document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     DREAMVERSE — MAIN JAVASCRIPT
     ========================================================= */

  /* =========================================================
     MOBILE HAMBURGER MENU
     ========================================================= */

  const hamburger = document.querySelector(".hamburger");
  const navigation = document.querySelector(".main-navigation");

  if (hamburger && navigation) {
    hamburger.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("active");

      hamburger.classList.toggle("active", isOpen);

      hamburger.setAttribute("aria-expanded", String(isOpen));

      hamburger.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu"
      );
    });

    /* Close menu when a navigation link is clicked */
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("active");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open menu");
      });
    });

    /* Close menu when clicking outside */
    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("active") &&
        !navigation.contains(event.target) &&
        !hamburger.contains(event.target)
      ) {
        navigation.classList.remove("active");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open menu");
      }
    });

    /* Reset menu when returning to desktop */
    window.addEventListener("resize", () => {
      if (window.innerWidth > 850) {
        navigation.classList.remove("active");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open menu");
      }
    });
  }


  /* =========================================================
     SMOOTH SCROLLING
     ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        /* Update URL without jumping */
        if (history.pushState) {
          history.pushState(null, "", targetId);
        }
      }
    });
  });


  /* =========================================================
     FAQ ACCORDION
     Works automatically if your FAQ uses <details>
     ========================================================= */

  const faqItems = document.querySelectorAll(".faq-item");

  if (faqItems.length > 0) {
    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");

      if (!question || !answer) return;

      question.addEventListener("click", () => {
        const isOpen = item.classList.contains("active");

        /* Close all other FAQ items */
        faqItems.forEach((otherItem) => {
          otherItem.classList.remove("active");

          const otherAnswer = otherItem.querySelector(".faq-answer");

          if (otherAnswer) {
            otherAnswer.style.maxHeight = null;
          }
        });

        /* Open selected item */
        if (!isOpen) {
          item.classList.add("active");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    });
  }


  /* =========================================================
     EXTERNAL LINKS
     ========================================================= */

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute("rel", "noopener noreferrer");
  });


  /* =========================================================
     EASTER EGG / SECRET TRIGGER
     ========================================================= */

  const secretTrigger = document.querySelector(".secret-trigger");
  const secretMessage = document.querySelector(".secret-message");

  if (secretTrigger && secretMessage) {
    secretTrigger.addEventListener("click", () => {
      secretMessage.classList.toggle("active");
    });
  }


  /* =========================================================
     ESC KEY
     Closes mobile menu and secret message
     ========================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (navigation && hamburger) {
      navigation.classList.remove("active");
      hamburger.classList.remove("active");

      hamburger.setAttribute("aria-expanded", "false");
      hamburger.setAttribute("aria-label", "Open menu");
    }

    if (secretMessage) {
      secretMessage.classList.remove("active");
    }
  });


  /* =========================================================
     HEADER SCROLL EFFECT
     ========================================================= */

  const header = document.querySelector("header");

  if (header) {
    const updateHeader = () => {
      if (window.scrollY > 30) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", updateHeader, {
      passive: true
    });

    updateHeader();
  }


  /* =========================================================
     CURRENT YEAR
     Automatically updates elements using .current-year
     ========================================================= */

  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });


  /* =========================================================
     IMAGE ERROR HANDLING
     Prevents broken images from looking ugly
     ========================================================= */

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.classList.add("image-error");
    });
  });


  /* =========================================================
     PAGE READY
     ========================================================= */

  document.documentElement.classList.add("js-ready");

});
