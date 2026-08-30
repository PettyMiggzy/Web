/* =========================================================================
   Simplicity Builds — analytics & conversion tracking

   Paid traffic is only worth buying if you can see which clicks turned into
   leads. Without a conversion signal the ad platform optimises for clicks,
   not customers, and you pay full price forever.

   CONFIGURE: put your IDs below. Leave a value empty and that provider is
   never loaded — no script, no cookie, no request. With all of them empty
   this file does nothing at all, which is the state it ships in.

     ga4   'G-XXXXXXXXXX'      Google Analytics 4
     ads   'AW-XXXXXXXXX'      Google Ads (for conversion import)
     adsLabel 'AW-XXXXXXXXX/AbC…'  the send_to value from the conversion action
     meta  '123456789012345'   Meta/Facebook pixel

   After setting `ads` + `adsLabel`, a submitted quote form reports a real
   conversion, and Smart Bidding can start optimising toward leads.
   ========================================================================= */
(function (w, d) {
  "use strict";

  var CONFIG = {
    ga4: "",
    ads: "",
    adsLabel: "",
    meta: "",
  };

  var loaded = { google: false, meta: false };

  function inject(src) {
    var s = d.createElement("script");
    s.async = true;
    s.src = src;
    d.head.appendChild(s);
  }

  /* ---- Google (GA4 and/or Google Ads share one gtag.js) ---- */
  if (CONFIG.ga4 || CONFIG.ads) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag("js", new Date());
    if (CONFIG.ga4) w.gtag("config", CONFIG.ga4);
    if (CONFIG.ads) w.gtag("config", CONFIG.ads);
    inject("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.ga4 || CONFIG.ads));
    loaded.google = true;
  }

  /* ---- Meta pixel ---- */
  if (CONFIG.meta) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (w,d,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    w.fbq("init", CONFIG.meta);
    w.fbq("track", "PageView");
    loaded.meta = true;
  }

  /**
   * Report a conversion. Safe to call whether or not anything is configured —
   * with no IDs this is a no-op, so the calling code never needs to check.
   *
   *   sbTrack('lead', { plan: 'launch', value: 49.99 })
   */
  w.sbTrack = function (event, params) {
    params = params || {};

    if (loaded.google) {
      // GA4 event, for reporting.
      if (CONFIG.ga4) w.gtag("event", event, params);
      // Google Ads conversion, for bidding. Needs the send_to label or Ads
      // records nothing — a config with `ads` but no `adsLabel` is the most
      // common reason a campaign reports zero conversions.
      if (CONFIG.ads && CONFIG.adsLabel && event === "lead") {
        w.gtag("event", "conversion", {
          send_to: CONFIG.adsLabel,
          value: params.value || 0,
          currency: "USD",
        });
      }
    }

    if (loaded.meta) {
      w.fbq("track", event === "lead" ? "Lead" : event, params);
    }
  };
})(window, document);
