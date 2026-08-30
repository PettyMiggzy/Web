/* =========================================================================
   POST /api/domain-check   { "name": "joes plumbing" }

   Checks a handful of TLDs for availability and returns at-cost pricing.
   The Porkbun credentials live in Cloudflare env vars and never reach the
   browser — that is the whole reason this runs server-side rather than as
   a fetch from the page.

   Configure once:
     wrangler pages secret put PORKBUN_API_KEY
     wrangler pages secret put PORKBUN_SECRET_KEY
   Use the sandbox keys (pk1_sb_… / sk1_sb_…) until you are happy with it.

   With no keys configured the endpoint still returns real pricing from
   Porkbun's public endpoint and says plainly that availability is offline —
   it never guesses, and never claims a name is free when it doesn't know.
   ========================================================================= */

const PB = 'https://api.porkbun.com/api/json/v3';
const TLDS = ['com', 'co', 'net', 'org'];
const MAX_TLDS = 4;

// A label must be a valid DNS label: letters, digits, hyphens; no leading or
// trailing hyphen; 63 chars max. Anything else is rejected rather than
// concatenated into an upstream URL.
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json;charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extra,
    },
  });

/** "Joe's Plumbing & Sons" -> "joesplumbing" */
export function toLabel(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 63)
    .replace(/^-+|-+$/g, '');
}

async function porkbun(path, body, signal) {
  const r = await fetch(`${PB}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok) throw new Error(`porkbun ${path} -> ${r.status}`);
  return r.json();
}

/** Public endpoint, no auth. Cached at the edge — prices change rarely.
    caches.default only exists in the Workers runtime, so the cache is
    feature-detected: outside it (tests, local node) this still fetches. */
async function getPricing(ctx) {
  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://internal/porkbun-pricing');

  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit.json();
  }

  const data = await porkbun('/pricing/get', {});
  if (data.status !== 'SUCCESS') throw new Error('pricing lookup failed');

  if (cache) {
    const res = new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json', 'cache-control': 'max-age=21600' },
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
  }
  return data;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Send JSON: { "name": "your business name" }' }, 400);
  }

  const label = toLabel(payload.name);
  if (!label || !LABEL.test(label)) {
    return json(
      { error: 'Enter a business name using letters and numbers.' },
      400
    );
  }

  // Caller may narrow the TLD list, but never widen it.
  const tlds = Array.isArray(payload.tlds)
    ? payload.tlds.filter((t) => TLDS.includes(t)).slice(0, MAX_TLDS)
    : TLDS;

  let pricing = {};
  try {
    pricing = (await getPricing(context)).pricing || {};
  } catch {
    /* pricing is a nicety; availability is the point. Carry on without it. */
  }

  const priceOf = (tld) => {
    const p = pricing[tld];
    if (!p) return null;
    const reg = Number(p.registration);
    const ren = Number(p.renewal);
    return Number.isFinite(reg) && Number.isFinite(ren)
      ? { registration: reg, renewal: ren }
      : null;
  };

  const key = env.PORKBUN_API_KEY;
  const secret = env.PORKBUN_SECRET_KEY;

  // Not configured: return honest pricing, no invented availability.
  if (!key || !secret) {
    return json({
      label,
      configured: false,
      note: 'Availability checking is not switched on yet — these are the at-cost prices we would pass through.',
      results: tlds.map((tld) => ({
        domain: `${label}.${tld}`,
        available: null,
        price: priceOf(tld),
      })),
    });
  }

  // 10s ceiling so a slow upstream can't hang the page.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10_000);

  try {
    const results = await Promise.all(
      tlds.map(async (tld) => {
        const domain = `${label}.${tld}`;
        try {
          const d = await porkbun(
            `/domain/checkDomain/${encodeURIComponent(domain)}`,
            { apikey: key, secretapikey: secret },
            ac.signal
          );
          const avail = d?.response?.avail;
          return {
            domain,
            available: avail === 'yes' ? true : avail === 'no' ? false : null,
            price: priceOf(tld),
          };
        } catch {
          // One TLD failing must not sink the others.
          return { domain, available: null, price: priceOf(tld) };
        }
      })
    );
    return json({ label, configured: true, results });
  } finally {
    clearTimeout(timer);
  }
}

// Anything other than POST gets a clear answer rather than a 405 with no body.
export const onRequest = async (context) =>
  context.request.method === 'POST'
    ? onRequestPost(context)
    : json({ error: 'POST a JSON body: { "name": "your business name" }' }, 405, {
        allow: 'POST',
      });
