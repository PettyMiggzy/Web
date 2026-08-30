/* Vercel serverless adapter for the domain checker.

   The site currently deploys to Vercel, which runs api/ and ignores
   functions/. The Cloudflare adapter in functions/api/ stays in place so the
   endpoint keeps working if hosting moves. Both are thin — everything they
   share lives in lib/domain-check.js, so a fix reaches both hosts. */
import { checkDomains, JSON_HEADERS } from '../lib/domain-check.js';

export default async function handler(req, res) {
  for (const [k, v] of Object.entries(JSON_HEADERS)) res.setHeader(k, v);

  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return res
      .status(405)
      .json({ error: 'POST a JSON body: { "name": "your business name" }' });
  }

  // Vercel parses JSON bodies, but not when the content-type is missing or
  // unexpected — accept a raw string too rather than 500ing on a stray request.
  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = null; }
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Send JSON: { "name": "your business name" }' });
  }

  const { status, body } = await checkDomains({
    name: payload.name,
    tlds: payload.tlds,
    key: process.env.PORKBUN_API_KEY,
    secret: process.env.PORKBUN_SECRET_KEY,
  });
  return res.status(status).json(body);
}
