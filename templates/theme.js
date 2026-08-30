/* =========================================================================
   Simplicity Builds — shared theme layer
   One token-driven stylesheet. Every vertical sets the tokens; the CSS
   never changes. That is what makes a build take minutes instead of hours.
   ========================================================================= */

/** Escape user/profile data before it touches HTML. */
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Escape for use inside a JS/JSON string in a <script> block. */
const escJson = (obj) =>
  JSON.stringify(obj).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');

/** Digits-only phone for tel: hrefs. */
const telHref = (p = '') => {
  const d = String(p).replace(/[^\d]/g, '');
  return d.length === 10 ? `+1${d}` : d.length ? `+${d}` : '';
};

/* ---------- The stylesheet. Themed entirely through CSS custom properties. */
const baseCSS = `
*,*::before,*::after{box-sizing:border-box}*{margin:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}}
body{font-family:var(--font-body);font-size:var(--fs-body);line-height:1.65;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}ul{list-style:none;padding:0}
button{font:inherit;cursor:pointer;border:none;background:none;color:inherit}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:4px}
h1,h2,h3{font-family:var(--font-head);font-weight:var(--head-weight);line-height:1.1;letter-spacing:-.015em;color:var(--ink-strong)}
h1{font-size:clamp(2.1rem,1.3rem+3.4vw,3.6rem)}
h2{font-size:clamp(1.7rem,1.2rem+2.1vw,2.6rem)}
h3{font-size:clamp(1.15rem,1rem+.7vw,1.4rem)}
p{color:var(--ink-soft)}
.wrap{width:100%;max-width:1140px;margin-inline:auto;padding-inline:clamp(1.1rem,4vw,2rem)}
section{padding-block:clamp(3.2rem,2rem+5vw,6rem)}
.eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--accent-ink)}
.lead{font-size:clamp(1.03rem,.98rem+.4vw,1.2rem);color:var(--ink-soft)}
.center{text-align:center}.mt1{margin-top:.6rem}.mt2{margin-top:1.2rem}.mt3{margin-top:2rem}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.95rem 1.7rem;border-radius:var(--radius-btn);font-weight:700;font-size:.98rem;transition:background .25s,color .25s,border-color .25s,transform .25s;white-space:nowrap}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:var(--accent);color:var(--on-accent)}
.btn-primary:hover{background:var(--accent-hover)}
.btn-ghost{border:2px solid var(--line-strong);color:var(--ink-strong)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent-ink)}
/* On dark grounds the ghost button must invert, or it goes dark-on-dark. */
.hero .btn-ghost{border-color:var(--hero-ink-soft);color:var(--hero-ink)}
.hero .btn-ghost:hover{background:var(--hero-ink);color:var(--hero-bg);border-color:var(--hero-ink)}
.skip{position:absolute;top:-100px;left:1rem;z-index:200;background:var(--accent);color:var(--on-accent);padding:.7rem 1.2rem;border-radius:6px;font-weight:700;transition:top .2s}
.skip:focus-visible{top:1rem}
/* demo bar — only rendered on spec sites */
.demobar{position:sticky;top:0;z-index:80;background:var(--demo-bg);color:var(--demo-ink);font-size:.8rem;text-align:center;padding:.55rem 1rem;line-height:1.4}
.demobar a{color:var(--demo-link);font-weight:700;white-space:nowrap}
.demobar a:hover{text-decoration:underline}
/* header */
header.site{position:sticky;top:var(--header-top,0);z-index:70;background:var(--header-bg);border-bottom:1px solid var(--line);backdrop-filter:blur(10px)}
.nav{display:flex;align-items:center;gap:1rem;padding:.9rem 0;flex-wrap:wrap}
.logo{display:flex;align-items:center;gap:.6rem;font-family:var(--font-head);font-weight:700;font-size:1.2rem;color:var(--ink-strong);margin-right:auto;letter-spacing:-.01em}
.logo .mk{width:36px;height:36px;border-radius:var(--radius-mark);background:var(--accent);color:var(--on-accent);display:grid;place-items:center;font-size:1rem;font-weight:800;flex:none}
.navlinks{display:flex;gap:1.5rem;font-size:.94rem;font-weight:600}
.navlinks a{color:var(--ink-soft);padding:.2rem 0}
.navlinks a:hover{color:var(--accent-ink)}
.navcall{display:inline-flex;align-items:center;gap:.45rem;font-weight:700;color:var(--ink-strong);white-space:nowrap}
.navcall svg{width:16px;height:16px;color:var(--accent-ink)}
@media(max-width:840px){
  .navlinks{order:3;flex-basis:100%;overflow-x:auto;gap:1.15rem;padding:.1rem 0 .6rem;scrollbar-width:none}
  .navlinks::-webkit-scrollbar{display:none}
  .nav{padding-bottom:.1rem;row-gap:.2rem}
  .nav .btn{padding:.7rem 1.1rem;font-size:.88rem}
}
@media(max-width:560px){
  /* Give the name its own row so the phone and CTA can never be pushed
     off-screen by a long business name. */
  .logo{flex-basis:100%;margin-right:0;font-size:1.06rem;gap:.5rem}
  .logo .mk{width:30px;height:30px;font-size:.85rem}
  .navcall{margin-right:auto;font-size:.95rem}
  .nav{column-gap:.7rem;row-gap:.55rem}
}
/* hero */
.hero{position:relative;overflow:hidden;background:var(--hero-bg);color:var(--hero-ink);padding-block:clamp(3.5rem,2rem+7vw,7rem)}
.hero h1{color:var(--hero-ink)}
.hero p{color:var(--hero-ink-soft)}
.hero .inner{position:relative;z-index:1;max-width:620px}
.hero .tag{display:inline-flex;align-items:center;gap:.5rem;background:var(--hero-chip);color:var(--hero-chip-ink);padding:.4rem .9rem;border-radius:999px;font-size:.85rem;font-weight:700;margin-bottom:1.1rem}
.hero .cta{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.9rem}
.hero .pts{display:flex;gap:.9rem 1.8rem;flex-wrap:wrap;margin-top:1.9rem;font-size:.92rem;color:var(--hero-ink-soft);font-weight:600}
.hero .pts span::before{content:"✓";color:var(--hero-check);font-weight:800;margin-right:.45rem}
.hero .art{position:absolute;inset:0;opacity:var(--hero-art-opacity,.5);background:var(--hero-art);pointer-events:none}
/* trust strip */
.strip{background:var(--strip-bg);border-block:1px solid var(--line)}
.strip .row{display:flex;flex-wrap:wrap;justify-content:space-around;gap:1.2rem 2rem;padding:1.5rem 0;text-align:center}
.strip b{color:var(--accent-ink);font-weight:800}
.strip .note{font-size:.78rem;color:var(--ink-mute);width:100%;text-align:center;padding-bottom:1.1rem;margin-top:-.4rem}
/* cards */
.head{max-width:640px;margin:0 auto clamp(2.2rem,1.5rem+2vw,3.2rem);text-align:center}
.grid{display:grid;gap:clamp(1rem,.8rem+1vw,1.5rem);grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))}
.card{background:var(--card-bg);border:1px solid var(--line);border-radius:var(--radius-card);padding:clamp(1.4rem,1.1rem+.9vw,1.9rem);transition:transform .3s,box-shadow .3s,border-color .3s}
.card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:var(--shadow)}
.card .ic{width:46px;height:46px;border-radius:var(--radius-mark);background:var(--accent-soft);color:var(--accent-ink);display:grid;place-items:center;margin-bottom:1rem;font-size:1.25rem}
.card h3{margin-bottom:.5rem}.card p{font-size:.95rem}
.card .price{margin-top:.8rem;font-weight:800;color:var(--accent-ink)}
/* split */
.split{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(1.6rem,1rem+3vw,3.5rem);align-items:center}
@media(max-width:840px){.split{grid-template-columns:1fr}}
.panel{background:var(--card-bg);border:1px solid var(--line);border-radius:var(--radius-card);padding:clamp(1.5rem,1.2rem+1vw,2.2rem)}
.checks li{display:flex;gap:.65rem;align-items:flex-start;padding:.4rem 0;color:var(--ink-soft);font-size:.97rem}
.checks li::before{content:"✓";color:var(--accent-ink);font-weight:800;flex:none}
/* hours */
.hours{width:100%;border-collapse:collapse;font-size:.96rem}
.hours th,.hours td{padding:.6rem .2rem;text-align:left;border-bottom:1px solid var(--line)}
.hours th{font-weight:700;color:var(--ink-strong)}
.hours td{color:var(--ink-soft);text-align:right}
/* form */
.form{display:grid;gap:.9rem}
.form label{font-weight:700;font-size:.9rem;display:block;margin-bottom:.35rem;color:var(--ink-strong)}
.form input,.form select,.form textarea{width:100%;padding:.85rem 1rem;border:1.5px solid var(--line-strong);border-radius:var(--radius-input);background:var(--input-bg);color:var(--ink);font:inherit;font-size:.96rem}
.form textarea{min-height:120px;resize:vertical}
.form input:focus,.form select:focus,.form textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-ring)}
.form .status{font-size:.9rem;font-weight:600;min-height:1.2em}
.vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* cta band */
.band{background:var(--band-bg);color:var(--band-ink);text-align:center;border-radius:var(--radius-card);padding:clamp(2.4rem,1.8rem+3vw,4rem) clamp(1.2rem,1rem+2vw,2.5rem)}
.band h2{color:var(--band-ink)}.band p{color:var(--band-ink-soft)}
.band .cta{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin-top:1.7rem}
.band .btn-ghost{border-color:var(--band-ink);color:var(--band-ink)}
.band .btn-ghost:hover{background:var(--band-ink);color:var(--band-bg)}
/* footer */
footer.site{background:var(--footer-bg);color:var(--footer-ink);padding-block:clamp(2.4rem,2rem+2vw,3.4rem) 1.8rem;font-size:.94rem}
footer.site a{color:var(--footer-link)}
.fgrid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:2rem}
@media(max-width:760px){.fgrid{grid-template-columns:1fr;gap:1.6rem}}
.fgrid h4{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.8rem;color:var(--footer-head)}
.fgrid p,.fgrid li{color:var(--footer-ink);opacity:.85;padding:.15rem 0}
.fbot{margin-top:2.2rem;padding-top:1.4rem;border-top:1px solid var(--footer-line);display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;font-size:.85rem;opacity:.8}
`;

module.exports = { esc, escJson, telHref, baseCSS };
