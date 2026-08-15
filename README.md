# Northlight Studio — website

A premium, hand-built marketing site for a small-business web-design company.
Pure static HTML/CSS/JS — no build step, no framework, no dependencies. Deploys
to Vercel (or any static host) in seconds.

> **Northlight** is a placeholder brand name — pick your favorite from
> [`BRAND.md`](BRAND.md) and rename in one step (instructions below).

---

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, services, process, work, pricing preview, promise, FAQ |
| `pricing.html` | Full pricing: plans, monthly/annual toggle, comparison table, add-ons |
| `services.html` | What we do — design, hosting, SEO, e-commerce, maintenance |
| `work.html` | Portfolio of design concepts / demos |
| `about.html` | Story, principles, positioning |
| `contact.html` | Lead form (Formspree-ready) + "what happens next" |
| `css/styles.css` | The whole design system |
| `js/main.js` | Nav, scroll reveals, FAQ, pricing toggle |
| `assets/favicon.svg` | Brand mark / favicon |
| `vercel.json` | Clean URLs + caching + security headers |

---

## Run it locally

It's just files, but internal links use clean URLs (`/pricing`, not
`/pricing.html`) to match Vercel's `cleanUrls` setting — so serve it with a
clean-URL-aware server:

```bash
npx serve .
```

Then visit `http://localhost:3000`. (Plain `python3 -m http.server` won't
resolve the extensionless links.)

---

## Deploy to Vercel

1. Push this repo to GitHub (already set up).
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
3. Framework preset: **Other** (it's static). No build command needed.
4. Deploy. Add your custom domain under **Project → Settings → Domains**.

**Why Vercel Pro pays off for your business:** one Pro seat ($20/mo) can host
**many** client projects. Since these are lightweight sites, your real hosting
cost per client drops to a couple dollars a month — which is why the margins
below work.

---

## Wire up the contact form (5 minutes)

The form posts to a placeholder. To actually receive leads:

1. Create a free form at **[formspree.io](https://formspree.io)** (or
   [basin](https://usebasin.com) / [getform](https://getform.io)).
2. Copy your endpoint, e.g. `https://formspree.io/f/abcdefg`.
3. In `contact.html`, replace `YOUR_FORM_ID` in the `<form action="...">`.

Until you do, the form shows a friendly "connect an endpoint" message instead
of submitting.

---

## Rename the brand (once you've chosen a name)

The brand name appears as the word **"Northlight"** and the email
`hello@northlight.studio`. To rebrand:

```bash
# from the repo root — replace with your chosen name / domain
grep -rl "Northlight" . --include="*.html" | xargs sed -i 's/Northlight/YourName/g'
grep -rl "northlight.studio" . --include="*.html" | xargs sed -i 's/northlight\.studio/yourdomain.com/g'
```

Then swap the mark in `assets/favicon.svg` if you want a different logo.
See [`BRAND.md`](BRAND.md) for name ideas and domain suggestions.

---

## Pricing model (the business behind the site)

See [`BRAND.md`](BRAND.md) → *Pricing strategy* for the full breakdown, margin
math, and positioning notes. Short version:

- **Launch $49.99/mo**, **Grow $89.99/mo**, **Scale $149.99/mo** — each with a
  one-time setup fee that's **waived on annual prepay**.
- **Own-It Build**: $799 one-time + $15/mo hosting, for clients who want to own
  outright.
- Add-on menu for everything else (SEO, e-commerce, extra pages, rush, etc.).
- Real cost per client on Vercel Pro ≈ **$3–5/mo** → ~90% gross margin on Launch.
- **Never** offer "unlimited edits" — the plans cap edits (2/5/priority) with
  $29 / 30-min overflow.
