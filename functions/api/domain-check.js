/* =========================================================================
   Cloudflare Pages adapter for the domain checker.

   Kept alongside the Vercel adapter in api/ so the endpoint survives a move
   between hosts: Vercel runs api/ and ignores functions/, Cloudflare does
   the reverse. Both are deliberately thin — everything that can be wrong
   lives in lib/domain-check.js, so a fix reaches both rather than one.

   Configure once:
     wrangler pages secret put PORKBUN_API_KEY      # pk1_sb_… for the sandbox
     wrangler pages secret put PORKBUN_SECRET_KEY   # sk1_sb_…

   Credentials stay in env vars and never reach the browser — the whole
   reason this runs server-side rather than as a fetch from the page.
   ========================================================================= */
import { checkDomains, JSON_HEADERS } from '../../lib/domain-check.js';

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Send JSON: { "name": "your business name" }' }, 400);
  }

  const { status, body } = await checkDomains({
    name: payload?.name,
    tlds: payload?.tlds,
    key: env.PORKBUN_API_KEY,
    secret: env.PORKBUN_SECRET_KEY,
  });
  return json(body, status);
}

// Anything other than POST gets a clear answer rather than a bare 405.
export const onRequest = async (context) =>
  context.request.method === 'POST'
    ? onRequestPost(context)
    : json({ error: 'POST a JSON body: { "name": "your business name" }' }, 405, {
        allow: 'POST',
      });
