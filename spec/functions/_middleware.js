/* =========================================================================
   Host-based routing for spec sites.

   One Cloudflare Pages project serves every spec site. A single wildcard
   custom domain (*.simplicitybuilds.com) covers all of them, so adding a
   prospect costs zero DNS work and zero projects — which matters, because
   Pages caps a free account at 100 projects.

     joes-plumbing.simplicitybuilds.com/  ->  /sites/joes-plumbing/index.html

   Reserved subdomains (www, mail, and the apex itself) are never rewritten,
   so this can never shadow the real marketing site or the mailbox.
   ========================================================================= */

const RESERVED = new Set([
  'www', 'mail', 'email', 'smtp', 'imap', 'pop', 'autodiscover',
  'ftp', 'cpanel', 'webmail', 'api', 'app', 'admin', 'ns1', 'ns2',
]);

// Only a-z, 0-9 and hyphen — matches the slugs new-site.js generates and
// blocks any traversal attempt through the Host header.
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  const parts = host.split('.');

  // Rewrite only for <slug>.<domain>.<tld> — never the apex, never a
  // deeper nesting, and never on the *.pages.dev preview host.
  if (parts.length !== 3 || host.endsWith('.pages.dev')) return next();

  const slug = parts[0];
  if (RESERVED.has(slug) || !SLUG.test(slug)) return next();

  // Already routed (direct /sites/... hit) — leave it alone.
  if (url.pathname.startsWith('/sites/')) return next();

  url.pathname = `/sites/${slug}${url.pathname === '/' ? '/index.html' : url.pathname}`;
  const res = await context.env.ASSETS.fetch(new Request(url, request));

  // Unknown slug: serve the project 404 rather than leaking a bare Pages error.
  if (res.status === 404) {
    return new Response(NOT_FOUND, {
      status: 404,
      headers: { 'content-type': 'text/html;charset=utf-8', 'x-robots-tag': 'noindex, nofollow' },
    });
  }

  // Belt and braces: a spec site must never be indexed even if a template
  // is ever built without its meta robots tag.
  const out = new Response(res.body, res);
  out.headers.set('x-robots-tag', 'noindex, nofollow');
  return out;
}

const NOT_FOUND = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Preview not found</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1419;color:#e8eef6;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem;line-height:1.6}
a{color:#5eead4}h1{font-weight:600;margin:0 0 .6rem}</style></head>
<body><div><h1>No preview here</h1>
<p>This preview link has expired or never existed.</p>
<p><a href="https://simplicitybuilds.com">Simplicity Builds &rarr;</a></p></div></body></html>`;
