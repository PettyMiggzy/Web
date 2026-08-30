/* =========================================================================
   Section renderers. Verticals pick which of these to use and in what order.
   Every function takes the client profile and returns an HTML string.
   ========================================================================= */
const { esc, telHref } = require('./theme');

const phoneSvg =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
  '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 1.9.6 2.8a2 2 0 01-.5 2.1L8.1 9.7a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.9.3 1.8.5 2.8.6a2 2 0 011.7 2z"/></svg>';

const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ---- spec-site disclosure bar ------------------------------------------ */
function demoBar(p) {
  if (!p.spec) return '';
  return `<div class="demobar">◈ Sample site built for ${esc(p.name)} by <strong>Simplicity Builds</strong> · <a href="${esc(p.studioUrl)}">Who made this?</a></div>`;
}

/* ---- header ------------------------------------------------------------ */
function header(p, nav) {
  const tel = telHref(p.phone);
  const call = tel
    ? `<a class="navcall" href="tel:${esc(tel)}">${phoneSvg}<span>${esc(p.phone)}</span></a>`
    : '';
  return `<header class="site"><div class="wrap nav">
  <a class="logo" href="#top"><span class="mk">${esc(initials(p.name))}</span>${esc(p.name)}</a>
  <nav class="navlinks" aria-label="Primary">${nav
    .map((n) => `<a href="#${esc(n.id)}">${esc(n.label)}</a>`)
    .join('')}</nav>
  ${call}<a class="btn btn-primary" href="#contact">${esc(p.ctaLabel)}</a>
</div></header>`;
}

/* ---- hero -------------------------------------------------------------- */
function hero(p) {
  const tel = telHref(p.phone);
  const points = (p.highlights || []).map((h) => `<span>${esc(h)}</span>`).join('');
  const second = tel
    ? `<a class="btn btn-ghost" href="tel:${esc(tel)}">${phoneSvg} Call ${esc(p.phone)}</a>`
    : `<a class="btn btn-ghost" href="#services">See what we do</a>`;
  return `<section class="hero" id="top"><div class="art" aria-hidden="true"></div><div class="wrap"><div class="inner">
  ${p.heroChip ? `<div class="tag">${esc(p.heroChip)}</div>` : ''}
  <h1>${esc(p.headline)}</h1>
  <p class="lead mt2">${esc(p.subhead)}</p>
  <div class="cta"><a class="btn btn-primary" href="#contact">${esc(p.ctaLabel)}</a>${second}</div>
  ${points ? `<div class="pts">${points}</div>` : ''}
</div></div></section>`;
}

/* ---- trust strip ------------------------------------------------------- */
function strip(p) {
  if (!(p.stats || []).length) return '';
  const row = p.stats.map((s) => `<div><b>${esc(s.value)}</b> ${esc(s.label)}</div>`).join('');
  return `<div class="strip"><div class="wrap"><div class="row">${row}</div>${
    p.spec ? '<p class="note">Sample figures shown on this preview — your real numbers go here.</p>' : ''
  }</div></div>`;
}

/* ---- services ---------------------------------------------------------- */
function services(p) {
  const cards = (p.services || [])
    .map(
      (s) => `<article class="card">
    <div class="ic" aria-hidden="true">${esc(s.icon || '◆')}</div>
    <h3>${esc(s.name)}</h3><p>${esc(s.text)}</p>
    ${s.price ? `<div class="price">${esc(s.price)}</div>` : ''}
  </article>`
    )
    .join('');
  return `<section id="services"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(p.servicesEyebrow)}</span>
  <h2 class="mt1">${esc(p.servicesTitle)}</h2>
  ${p.servicesIntro ? `<p class="lead mt2">${esc(p.servicesIntro)}</p>` : ''}</div>
  <div class="grid">${cards}</div>
</div></section>`;
}

/* ---- about + why-us split ---------------------------------------------- */
function about(p) {
  const checks = (p.reasons || []).map((r) => `<li>${esc(r)}</li>`).join('');
  return `<section id="about"><div class="wrap split">
  <div>
    <span class="eyebrow">${esc(p.aboutEyebrow)}</span>
    <h2 class="mt1">${esc(p.aboutTitle)}</h2>
    <p class="lead mt2">${esc(p.aboutText)}</p>
    ${checks ? `<ul class="checks mt3">${checks}</ul>` : ''}
  </div>
  <div class="panel">
    <h3>${esc(p.panelTitle)}</h3>
    <p class="mt1">${esc(p.panelText)}</p>
    <a class="btn btn-primary mt3" href="#contact" style="display:inline-flex">${esc(p.ctaLabel)}</a>
  </div>
</div></section>`;
}

/* ---- hours + location -------------------------------------------------- */
function hours(p) {
  if (!(p.hours || []).length) return '';
  const rows = p.hours
    .map((h) => `<tr><th scope="row">${esc(h.day)}</th><td>${esc(h.time)}</td></tr>`)
    .join('');
  const tel = telHref(p.phone);
  return `<section id="visit"><div class="wrap split">
  <div>
    <span class="eyebrow">${esc(p.hoursEyebrow || 'Visit us')}</span>
    <h2 class="mt1">${esc(p.hoursTitle || 'Where to find us')}</h2>
    ${p.address ? `<p class="lead mt2">${esc(p.address)}</p>` : ''}
    ${tel ? `<p class="mt2"><a class="navcall" href="tel:${esc(tel)}">${phoneSvg}<span>${esc(p.phone)}</span></a></p>` : ''}
  </div>
  <div class="panel"><table class="hours"><caption class="vh">Opening hours</caption><tbody>${rows}</tbody></table></div>
</div></section>`;
}

/* ---- contact form ------------------------------------------------------ */
function contact(p) {
  const opts = (p.services || [])
    .slice(0, 6)
    .map((s) => `<option value="${esc(s.name)}">${esc(s.name)}</option>`)
    .join('');
  const tel = telHref(p.phone);
  return `<section id="contact"><div class="wrap split" style="align-items:start">
  <div class="panel">
    <h2>${esc(p.formTitle)}</h2>
    <p class="mt1">${esc(p.formText)}</p>
    <form class="form mt3" data-lead novalidate>
      <div><label for="cn">Your name</label><input id="cn" name="name" autocomplete="name" required></div>
      <div><label for="cp">Phone</label><input id="cp" name="phone" type="tel" autocomplete="tel" required></div>
      ${opts ? `<div><label for="cs">What do you need?</label><select id="cs" name="service"><option value="">Choose one…</option>${opts}<option value="Something else">Something else</option></select></div>` : ''}
      <div><label for="cm">Anything else? (optional)</label><textarea id="cm" name="message"></textarea></div>
      <button class="btn btn-primary" type="submit" style="width:100%">${esc(p.formButton)}</button>
      <p class="status" role="status" aria-live="polite"></p>
    </form>
  </div>
  <div>
    <h3>${esc(p.nextTitle || 'What happens next')}</h3>
    <ul class="checks mt2">${(p.nextSteps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    ${tel ? `<p class="mt3">Prefer to talk? <a class="navcall" href="tel:${esc(tel)}">${phoneSvg}<span>${esc(p.phone)}</span></a></p>` : ''}
  </div>
</div></section>`;
}

/* ---- closing CTA ------------------------------------------------------- */
function band(p) {
  const tel = telHref(p.phone);
  return `<section><div class="wrap"><div class="band">
  <h2>${esc(p.bandTitle)}</h2>
  <p class="lead mt2">${esc(p.bandText)}</p>
  <div class="cta"><a class="btn btn-primary" href="#contact">${esc(p.ctaLabel)}</a>${
    tel ? `<a class="btn btn-ghost" href="tel:${esc(tel)}">Call ${esc(p.phone)}</a>` : ''
  }</div>
</div></div></section>`;
}

/* ---- footer ------------------------------------------------------------ */
function footer(p, nav) {
  const tel = telHref(p.phone);
  const year = new Date().getFullYear();
  return `<footer class="site"><div class="wrap">
  <div class="fgrid">
    <div>
      <div class="logo" style="color:var(--footer-head)"><span class="mk">${esc(initials(p.name))}</span>${esc(p.name)}</div>
      <p class="mt2">${esc(p.footerBlurb || p.subhead)}</p>
    </div>
    <div><h4>Explore</h4><ul>${nav.map((n) => `<li><a href="#${esc(n.id)}">${esc(n.label)}</a></li>`).join('')}</ul></div>
    <div><h4>Get in touch</h4><ul>
      ${tel ? `<li><a href="tel:${esc(tel)}">${esc(p.phone)}</a></li>` : ''}
      ${p.email ? `<li><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>` : ''}
      ${p.address ? `<li>${esc(p.address)}</li>` : ''}
    </ul></div>
  </div>
  <div class="fbot">
    <span>© ${year} ${esc(p.name)}.</span>
    <span>${
      p.spec
        ? `Sample site — designed &amp; built by <a href="${esc(p.studioUrl)}">Simplicity Builds</a>`
        : `Site by <a href="${esc(p.studioUrl)}">Simplicity Builds</a>`
    }</span>
  </div>
</div></footer>`;
}

module.exports = { demoBar, header, hero, strip, services, about, hours, contact, band, footer, phoneSvg, initials };
