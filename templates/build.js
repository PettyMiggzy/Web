/* =========================================================================
   The engine. Profile (JSON) + vertical -> one self-contained HTML file.
   Self-contained on purpose: no asset paths to break, deploys anywhere,
   and a spec site can be handed over as a single file.
   ========================================================================= */
const { esc, escJson, telHref, baseCSS } = require('./theme');
const S = require('./sections');

const VERTICALS = {
  trades: require('./verticals/trades'),
  cafe: require('./verticals/cafe'),
  wellness: require('./verticals/wellness'),
  retail: require('./verticals/retail'),
  professional: require('./verticals/professional'),
};

const RENDER = {
  hero: S.hero,
  strip: S.strip,
  services: S.services,
  about: S.about,
  hours: S.hours,
  contact: S.contact,
  band: S.band,
};

/** Required profile fields — fail loudly rather than ship a broken site. */
const REQUIRED = ['name', 'vertical', 'headline', 'subhead'];

function buildSite(profile) {
  for (const f of REQUIRED) {
    if (!profile[f]) throw new Error(`profile is missing required field: ${f}`);
  }
  const v = VERTICALS[profile.vertical];
  if (!v) {
    throw new Error(
      `unknown vertical "${profile.vertical}". Options: ${Object.keys(VERTICALS).join(', ')}`
    );
  }

  // vertical defaults < profile overrides
  const p = { studioUrl: 'https://simplicitybuilds.com', ...v.defaults, ...profile };
  const nav = p.nav || v.nav;

  const tokens = { ...v.tokens, ...(p.tokens || {}) };
  if (p.spec) tokens['--header-top'] = 'var(--demobar-h,34px)';
  const tokenCSS = Object.entries(tokens)
    .map(([k, val]) => `${k}:${val}`)
    .join(';');

  const body = v.order.map((k) => (RENDER[k] ? RENDER[k](p) : '')).join('\n');

  // Spec sites must never be indexed — a fictional/unsold site in Google is a
  // liability for the studio and confusing for the business it depicts.
  const robots = p.spec ? 'noindex,nofollow' : 'index,follow';
  const desc = p.description || `${p.name} — ${p.subhead}`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': p.schemaType || 'LocalBusiness',
    name: p.name,
    description: desc,
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.email ? { email: p.email } : {}),
    ...(p.address ? { address: { '@type': 'PostalAddress', streetAddress: p.address } } : {}),
    ...(p.url ? { url: p.url } : {}),
  };

  const leadTarget = p.leadEndpoint || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.name)}${p.titleSuffix ? ' — ' + esc(p.titleSuffix) : ''}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="${esc(tokens['--hero-bg'])}">
${p.url ? `<link rel="canonical" href="${esc(p.url)}">` : ''}
<meta property="og:title" content="${esc(p.name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
${p.url ? `<meta property="og:url" content="${esc(p.url)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${v.fonts}&display=swap" rel="stylesheet">
<style>:root{${tokenCSS}}${baseCSS}</style>
<script type="application/ld+json">${escJson(ld)}</script>
</head>
<body>
<a class="skip" href="#top">Skip to content</a>
${S.demoBar(p)}
${S.header(p, nav)}
<main>
${body}
</main>
${S.footer(p, nav)}
<script>
(function(){
  var f=document.querySelector('form[data-lead]');
  if(!f)return;
  var endpoint=${JSON.stringify(leadTarget)};
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var s=f.querySelector('.status');
    if(!f.checkValidity()){f.reportValidity();return;}
    var btn=f.querySelector('button[type=submit]');
    if(!endpoint){
      // No endpoint wired yet: never imply the message was sent.
      s.textContent='This preview isn\\u2019t connected to a live inbox yet \\u2014 call us and we\\u2019ll pick up.';
      s.style.color='var(--accent-ink)';
      return;
    }
    btn.disabled=true;s.textContent='Sending\\u2026';s.style.color='var(--ink-soft)';
    fetch(endpoint,{method:'POST',headers:{'Accept':'application/json'},body:new FormData(f)})
      .then(function(r){
        if(!r.ok)throw new Error('bad status');
        f.reset();
        s.textContent='Thanks \\u2014 we\\u2019ve got it. We\\u2019ll be in touch shortly.';
        s.style.color='var(--accent-ink)';
      })
      .catch(function(){
        s.textContent='Something went wrong. Please call us instead \\u2014 we\\u2019ll sort it out.';
        s.style.color='#b3261e';
      })
      .finally(function(){btn.disabled=false;});
  });
})();
</script>
</body>
</html>`;
}

module.exports = { buildSite, VERTICALS };
