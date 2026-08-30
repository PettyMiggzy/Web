/* =========================================================================
   Domain availability + at-cost pricing — host-agnostic core.

   The HTTP wrappers live in api/ (Vercel) and functions/api/ (Cloudflare).
   Only the wrappers know about Request/Response shapes; everything that can
   actually be wrong lives here, in one place, so a fix reaches both hosts.
   ========================================================================= */

const PB = 'https://api.porkbun.com/api/json/v3';
export const TLDS = ['com', 'co', 'net', 'org'];
const MAX_TLDS = 4;

// A label must be a valid DNS label: letters, digits, hyphens; no leading or
// trailing hyphen; 63 chars max. Anything else is rejected rather than
// concatenated into an upstream URL.
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** "Joe's Plumbing & Sons" -> "joesplumbingandsons" */
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

/* Pricing is public and changes rarely. An in-process cache is all the
   sharing we can rely on: Vercel and Cloudflare have different cache APIs
   and neither guarantees the same instance serves the next request, so this
   is treated as a bonus rather than something correctness depends on. */
let priceCache = null;
let priceCacheAt = 0;
const PRICE_TTL_MS = 6 * 60 * 60 * 1000;

async function getPricing() {
  if (priceCache && Date.now() - priceCacheAt < PRICE_TTL_MS) return priceCache;
  const data = await porkbun('/pricing/get', {});
  if (data.status !== 'SUCCESS') throw new Error('pricing lookup failed');
  priceCache = data.pricing || {};
  priceCacheAt = Date.now();
  return priceCache;
}

/**
 * @returns {{status:number, body:object}} — ready for either host to serialize.
 */
export async function checkDomains({ name, tlds: requested, key, secret }) {
  const label = toLabel(name);
  if (!label || !LABEL.test(label)) {
    return { status: 400, body: { error: 'Enter a business name using letters and numbers.' } };
  }

  // Caller may narrow the TLD list, but never widen it.
  const tlds = Array.isArray(requested)
    ? requested.filter((t) => TLDS.includes(t)).slice(0, MAX_TLDS)
    : TLDS;

  let pricing = {};
  try {
    pricing = await getPricing();
  } catch {
    /* Pricing is a nicety; availability is the point. Carry on without it. */
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

  // Not configured: return honest pricing, never invented availability.
  if (!key || !secret) {
    return {
      status: 200,
      body: {
        label,
        configured: false,
        note: 'Availability checking is not switched on yet — these are the at-cost prices we would pass through.',
        results: tlds.map((tld) => ({
          domain: `${label}.${tld}`,
          available: null,
          price: priceOf(tld),
        })),
      },
    };
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
    return { status: 200, body: { label, configured: true, results } };
  } finally {
    clearTimeout(timer);
  }
}

export const JSON_HEADERS = {
  'content-type': 'application/json;charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
