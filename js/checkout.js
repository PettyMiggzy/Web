/* =========================================================================
   Simplicity Builds — checkout links

   Stripe Payment Links. No secret key, no server, no card data touching our
   code — the button is an anchor to Stripe's hosted checkout.

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

  // Empty until the live account's links exist. Do not paste test URLs here.
  var LIVE = {
    launch_monthly: "",
    grow_monthly:   "",
    scale_monthly:  "",
    launch_annual:  "",
    grow_annual:    "",
    scale_annual:   "",
    ownit:          ""
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
