/* =========================================================================
   Simplicity Builds — interactions
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

  /* ---- Domain availability checker ---- */
  const domainForm = document.querySelector("form[data-domain]");
  if (domainForm) {
    const input = domainForm.querySelector("#dq");
    const status = domainForm.querySelector(".domain-status");
    const list = domainForm.querySelector(".domain-results");
    const btn = domainForm.querySelector("button[type=submit]");

    const money = (n) =>
      typeof n === "number" ? "$" + n.toFixed(2) : null;

    const render = (data) => {
      list.textContent = "";
      data.results.forEach((r) => {
        const li = document.createElement("li");

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = r.domain;          // textContent, never innerHTML
        li.append(name);

        const tag = document.createElement("span");
        if (r.available === true) { tag.className = "tag yes"; tag.textContent = "Available"; }
        else if (r.available === false) { tag.className = "tag no"; tag.textContent = "Taken"; }
        else { tag.className = "tag unknown"; tag.textContent = "Price only"; }
        li.append(tag);

        if (r.price) {
          const cost = document.createElement("span");
          cost.className = "cost";
          cost.textContent =
            r.price.renewal && r.price.renewal !== r.price.registration
              ? `${money(r.price.registration)} first year, then ${money(r.price.renewal)}/yr`
              : `${money(r.price.registration)}/yr`;
          li.append(cost);
        }
        list.append(li);
      });
      list.hidden = data.results.length === 0;
    };

    domainForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) { input.focus(); return; }

      btn.disabled = true;
      status.textContent = "Checking…";
      status.style.color = "var(--text-mute)";
      list.hidden = true;

      fetch("/api/domain-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: q }),
      })
        .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
        .then(({ ok, body }) => {
          if (!ok) {
            status.textContent = body.error || "Couldn’t check that name — try another.";
            status.style.color = "var(--accent-2)";
            return;
          }
          render(body);
          status.textContent = body.configured
            ? "Prices are what the registrar charges. We don’t mark them up, and the domain is registered in your name."
            : body.note || "Availability checking isn’t switched on yet — these are the at-cost prices.";
          status.style.color = "var(--text-mute)";
        })
        .catch(() => {
          status.textContent =
            "Couldn’t reach the domain service just now. Mention the name you want in the form below and we’ll check it for you.";
          status.style.color = "var(--accent-2)";
        })
        .finally(() => { btn.disabled = false; });
    });
  }

  /* ---- Contact form ----
     Submits over fetch so the visitor stays on the page instead of being
     handed off to the form provider's thank-you screen. The form keeps its
     action and method, so with JS off it still posts natively and the lead
     still arrives — this is an enhancement, not the only path. */
  const form = document.querySelector("form[data-contact]");
  if (form) {
    const status = form.querySelector(".form-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    // Built as nodes rather than innerHTML: part of this text reflects a
    // server response, and none of it needs to be markup.
    const say = (text, color, withEmail) => {
      if (!status) return;
      status.textContent = text;
      if (withEmail) {
        const a = document.createElement("a");
        a.href = "mailto:team@simplicitybuilds.com";
        a.textContent = "team@simplicitybuilds.com";
        a.style.textDecoration = "underline";
        status.append(" ", a, ".");
      }
      status.style.color = color;
    };

    const OFFLINE = "Our form is briefly offline — please email us directly at";

    form.addEventListener("submit", (e) => {
      const action = form.getAttribute("action") || "";

      // No real endpoint wired: route to email rather than pretend a lost
      // submission succeeded.
      if (action.includes("YOUR_FORM_ID") || action === "#") {
        e.preventDefault();
        say(OFFLINE, "var(--accent-2)", true);
        return;
      }

      // Without fetch, let the browser post natively — that path still works.
      if (!window.fetch) return;

      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      say("Sending…", "var(--text-mute)");

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then((r) => r.json().catch(() => ({})).then((body) => ({ ok: r.ok, body })))
        .then(({ ok, body }) => {
          if (ok) {
            // Report the conversion only once the provider actually accepted
            // the lead. Firing on click instead would count every abandoned
            // and failed submit, and the ad platform would optimise toward
            // traffic that never becomes a customer.
            if (typeof window.sbTrack === "function") {
              const plan = (form.querySelector("#plan") || {}).value || "";
              window.sbTrack("lead", {
                plan: plan,
                value: { launch: 49.99, grow: 69.99, scale: 149.99, ownit: 799 }[plan] || 0,
              });
            }
            form.reset();
            say("Thanks — that’s with us. We’ll reply within one business day.",
                "var(--accent)");
            if (submitBtn) submitBtn.textContent = "Sent";
            return;
          }
          // Formspree returns field-level errors; surface the first one
          // plainly rather than a generic failure nobody can act on.
          const first =
            body && Array.isArray(body.errors) && body.errors.length
              ? body.errors[0].message
              : null;
          say(first ? "Couldn’t send: " + first
                    : "Something went wrong sending that. Please email us at",
              "var(--accent-2)", !first);
          if (submitBtn) submitBtn.disabled = false;
        })
        .catch(() => {
          // Network failure. Never show success for a lead that didn't land.
          say(OFFLINE, "var(--accent-2)", true);
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
