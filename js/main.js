/* =========================================================================
   Northlight Studio — interactions
   Vanilla JS, no dependencies. Progressive: page works without it.
   ========================================================================= */
(function () {
  "use strict";

  /* ---- Sticky header: condense on scroll ---- */
  const header = document.querySelector(".site-header");
  let scrolled = null;
  const onScroll = () => {
    if (!header) return;
    const s = window.scrollY > 24;
    if (s !== scrolled) {
      scrolled = s;
      header.classList.toggle("scrolled", s);
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const body = document.body;
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    const setMenu = (open) => {
      body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      body.style.overflow = open ? "hidden" : "";
      if (!open) toggle.focus();
    };
    toggle.addEventListener("click", () => setMenu(!body.classList.contains("nav-open")));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("nav-open")) setMenu(false);
    });
    document.querySelectorAll(".mobile-menu a").forEach((a) =>
      a.addEventListener("click", () => {
        body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
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
      if (isOpen) {
        answer.style.maxHeight = answer.scrollHeight + "px";
        // Once fully open, release the pixel cap so later reflows never clip it
        answer.addEventListener(
          "transitionend",
          () => { if (item.classList.contains("open")) answer.style.maxHeight = "none"; },
          { once: true }
        );
      } else {
        // From "none" back to a measured value so the collapse can animate
        answer.style.maxHeight = answer.scrollHeight + "px";
        requestAnimationFrame(() => { answer.style.maxHeight = "0px"; });
      }
    });
  });

  /* ---- Pricing monthly / annual toggle ---- */
  const priceSwitch = document.querySelector(".switch");
  if (priceSwitch) {
    const labels = document.querySelectorAll(".toggle-label");
    const status = document.querySelector(".toggle-status");
    const setMode = (annual) => {
      priceSwitch.setAttribute("aria-checked", String(annual));
      document.querySelectorAll("[data-monthly]").forEach((el) => {
        el.textContent = annual ? el.dataset.annual : el.dataset.monthly;
      });
      document.querySelectorAll("[data-setup]").forEach((el) => {
        el.innerHTML = annual ? el.dataset.setupAnnual : el.dataset.setupMonthly;
      });
      if (labels[0]) labels[0].classList.toggle("on", !annual);
      if (labels[1]) labels[1].classList.toggle("on", annual);
      if (status) {
        status.textContent = annual
          ? "Showing annual prices — two months free, setup fee waived"
          : "Showing monthly prices";
      }
    };
    priceSwitch.addEventListener("click", () => {
      setMode(priceSwitch.getAttribute("aria-checked") !== "true");
    });
    setMode(false);
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Contact form: preselect plan from ?plan= query ---- */
  const planSelect = document.getElementById("plan");
  if (planSelect) {
    const wanted = new URLSearchParams(location.search).get("plan");
    if (wanted && planSelect.querySelector('option[value="' + wanted + '"]')) {
      planSelect.value = wanted;
    }
  }

  /* ---- Contact form (front-end validation + friendly submit) ---- */
  const form = document.querySelector("form[data-contact]");
  if (form) {
    form.addEventListener("submit", (e) => {
      // If no real endpoint is wired yet, prevent default and route to email
      // instead — never pretend a lost submission succeeded.
      const action = form.getAttribute("action") || "";
      if (action.includes("YOUR_FORM_ID") || action === "#") {
        e.preventDefault();
        const status = form.querySelector(".form-status");
        if (status) {
          status.innerHTML =
            'Our form is briefly offline — please email us directly at ' +
            '<a href="mailto:hello@northlight.studio" style="text-decoration:underline;">hello@northlight.studio</a> ' +
            "and we’ll reply within one business day.";
          status.style.color = "var(--accent-2)";
        }
      }
    });
  }
})();
