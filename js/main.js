/* =========================================================================
   Northlight Studio — interactions
   Vanilla JS, no dependencies. Progressive: page works without it.
   ========================================================================= */
(function () {
  "use strict";

  /* ---- Sticky header: condense on scroll ---- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const body = document.body;
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      body.classList.toggle("nav-open");
      const open = body.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".mobile-menu a").forEach((a) =>
      a.addEventListener("click", () => {
        body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        body.style.overflow = "";
      })
    );
  }

  /* ---- Reveal on scroll ---- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const answer = item.querySelector(".faq-a");
      const isOpen = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(isOpen));
      answer.style.maxHeight = isOpen ? answer.scrollHeight + "px" : "0px";
    });
  });

  /* ---- Pricing monthly / annual toggle ---- */
  const priceSwitch = document.querySelector(".switch");
  if (priceSwitch) {
    const labels = document.querySelectorAll(".toggle-label");
    const setMode = (annual) => {
      priceSwitch.setAttribute("aria-pressed", String(annual));
      document.querySelectorAll("[data-monthly]").forEach((el) => {
        el.textContent = annual ? el.dataset.annual : el.dataset.monthly;
      });
      document.querySelectorAll("[data-setup]").forEach((el) => {
        el.innerHTML = annual ? el.dataset.setupAnnual : el.dataset.setupMonthly;
      });
      if (labels[0]) labels[0].classList.toggle("on", !annual);
      if (labels[1]) labels[1].classList.toggle("on", annual);
    };
    priceSwitch.addEventListener("click", () => {
      setMode(priceSwitch.getAttribute("aria-pressed") !== "true");
    });
    setMode(false);
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Contact form (front-end validation + friendly submit) ---- */
  const form = document.querySelector("form[data-contact]");
  if (form) {
    form.addEventListener("submit", (e) => {
      // If no real endpoint is wired yet, prevent default and show a message.
      const action = form.getAttribute("action") || "";
      if (action.includes("YOUR_FORM_ID") || action === "#") {
        e.preventDefault();
        const status = form.querySelector(".form-status");
        if (status) {
          status.textContent =
            "Thanks! Connect a Formspree/Basin endpoint to receive this (see README).";
          status.style.color = "var(--accent-2)";
        }
      }
    });
  }
})();
