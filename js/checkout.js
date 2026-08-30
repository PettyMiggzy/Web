/* =========================================================================
   Simplicity Builds — checkout links

   Hosted payment links. No secret key, no server, no card data touching our
   code — the button is just an anchor to the provider's hosted checkout.

   PROVIDER-AGNOSTIC BY DESIGN. These are URLs, so Square, Stripe and PayPal
   are interchangeable: create a link per plan in whichever dashboard, paste
   the URLs below, done. Nothing else in the codebase knows or cares which
   provider is behind them.

     Square  Dashboard > Online > Payment Links > Create > "Accept recurring
             payments", one per plan and interval.
     Stripe  Dashboard > Payment links > New.

   Whichever you pick, the plan/interval mapping below is what keeps the
   button in step with the price the visitor is looking at.

   TEST vs LIVE: the site uses LIVE links. TEST links are kept here so the
   flow can be exercised without moving money, but they are never served to
   a visitor — a test link on the public site would take someone through a
   checkout that cannot actually charge them.

   To go live: paste the live URLs into LIVE below. Until a plan has a live
   URL, its button falls back to /contact rather than leading somewhere
   broken.
   ========================================================================= */
(function (w) {
  "use strict";

  var TEST = {
    launch_monthly: "https://buy.stripe.com/test_fZudRa71L0IrdWr4gTcMM00",
    grow_monthly:   "https://buy.stripe.com/test_14A28s0Dnaj15pV8x9cMM01",
    scale_monthly:  "https://buy.stripe.com/test_eVq5kE5XH8aT05B7t5cMM02",
    launch_annual:  "https://buy.stripe.com/test_3cI5kEdq9cr97y300DcMM03",
    grow_annual:    "https://buy.stripe.com/test_cNi00k0Dncr97y314HcMM04",
    scale_annual:   "https://buy.stripe.com/test_aFaeVe1Hr62L2dJcNpcMM05",
    ownit:          "https://buy.stripe.com/test_14AaEY2Lv9eXf0vdRtcMM06"
  };

  // Live links. These charge real cards. Never paste a test URL here.
  var LIVE = {
    launch_monthly: "https://buy.stripe.com/3cI6oI9dF7x4cq100w5ZC00",
    grow_monthly:   "https://buy.stripe.com/4gM4gA1Ld9Fc61D28E5ZC01",
    scale_monthly:  "https://buy.stripe.com/cNiaEY89B5oWcq13cI5ZC02",
    launch_annual:  "https://buy.stripe.com/fZu5kEgG74kS9dPfZu5ZC03",
    grow_annual:    "https://buy.stripe.com/8x2aEYcpReZw2PreVq5ZC04",
    scale_annual:   "https://buy.stripe.com/4gM8wQ4Xp2cK89L3cI5ZC05",
    ownit:          "https://buy.stripe.com/eVqaEY2Phg3A1LndRm5ZC06"
  };

  /* Test links are used only on localhost, so a visitor to the real site can
     never be handed one. */
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(w.location.hostname);
  var LINKS = isLocal ? TEST : LIVE;

  w.sbCheckout = {
    testMode: isLocal,
    /** URL for a plan+interval, or "" when not yet configured. */
    url: function (plan, annual) {
      if (plan === "ownit") return LINKS.ownit || "";
      return LINKS[plan + (annual ? "_annual" : "_monthly")] || "";
    }
  };

  /* Point every [data-plan] button at the right link, and re-point them when
     the monthly/annual toggle flips. A plan with no configured link keeps
     its existing /contact href — an unconfigured plan must send someone to a
     human, never to a dead or wrong-priced checkout. */
  function apply(annual) {
    var els = document.querySelectorAll("[data-plan]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var url = w.sbCheckout.url(el.getAttribute("data-plan"), annual);
      if (!url) continue;
      if (!el.hasAttribute("data-fallback-href")) {
        el.setAttribute("data-fallback-href", el.getAttribute("href") || "/contact");
      }
      el.setAttribute("href", url);
    }
  }

  w.sbCheckout.apply = apply;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { apply(false); });
  } else {
    apply(false);
  }
})(window);
