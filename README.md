# Simplicity Builds — website

A premium, hand-built marketing site for a small-business web-design company.
Pure static HTML/CSS/JS — no build step, no framework, no dependencies. Deploys
to Vercel (or any static host) in seconds.

> The brand is **Simplicity Builds** (`simplicitybuilds.com`). If you ever want
> to rename again, the one-step instructions are below.

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

## The site factory (templates/)

Five vertical templates behind one engine. A profile JSON goes in, a single
self-contained HTML file comes out — no external assets, no broken paths, and
a spec site can be handed over as one file.

```bash
node new-site.js --list                      # show verticals
cp clients/_example.json clients/joes.json   # fill from their Google Business Profile
node new-site.js clients/joes.json           # -> dist/joes/index.html
node new-site.js clients/*.json              # rebuild everything
```

| Vertical | For |
|---|---|
| `trades` | Plumbing, HVAC, electrical, roofing, landscaping |
| `cafe` | Cafés, bakeries, restaurants |
| `wellness` | Yoga, massage, salons, spas |
| `retail` | Shops, boutiques, galleries |
| `professional` | Dental, legal, accounting, clinics |

Each vertical is a token set plus copy defaults in `templates/verticals/`. The
stylesheet in `templates/theme.js` never changes — that is what makes a build
take minutes instead of hours. To add a sixth vertical, copy a file in
`verticals/`, change the tokens, and register it in `templates/build.js`.

**Profile fields.** `name`, `vertical`, `headline` and `subhead` are required;
everything else falls back to the vertical's defaults. Set `spec: true` for a
prospecting site — that adds the "sample site" disclosure bar and forces
`noindex,nofollow` so an unsold site never lands in Google. Set `leadEndpoint`
to a form URL to make the contact form live; leave it empty and the form tells
the visitor plainly that it is not connected rather than faking a success
message.

**Deliberately no images.** Templates ship with typographic and gradient
treatments only. AI-generated imagery carries no copyright (see BRAND.md), so
it cannot be assigned to a client under an IP-transfer clause — use the
client's own photos, or licensed stock, on anything you sell.

Every template is verified on each build: 16 contrast pairs per vertical at
WCAG AA, one `h1`, four landmarks, zero dead links, labelled form fields, valid
JSON-LD, and no horizontal overflow down to 344px.

---

## Domain & DNS (simplicitybuilds.com)

DNS is managed **at GoDaddy**, not Vercel. This is deliberate: the mailbox
(`hello@simplicitybuilds.com`) is GoDaddy-hosted, and switching nameservers to
Vercel would drop the MX records and break email. Vercel's own docs warn that
changing nameservers requires re-creating every record you want to keep.

Records to set in GoDaddy → Domain → DNS:

| Type  | Name | Value                                        |
|-------|------|----------------------------------------------|
| A     | `@`  | `76.76.21.21`                                |
| CNAME | `www`| the project-specific value from Vercel        |

Vercel now issues a per-project CNAME target (e.g. `d1d4….vercel-dns-017.com`)
rather than a shared one — read the exact value from
**Vercel → project → Settings → Domains** after adding the domain, and prefer it
over anything written here.

Email is set up separately under GoDaddy → Email & Office; that wizard adds the
MX and SPF records. Send a test message to confirm delivery before relying on it.

Verify the whole chain afterwards:

```bash
curl -sI https://simplicitybuilds.com | head -1        # expect 200, valid TLS
curl -sI https://simplicitybuilds.com/assets/og-image.png | head -1
```

If the site ever moves hosts, `./set-site-url.sh https://newhost.com` rewrites
every canonical, og:url, og:image and sitemap entry in one pass.

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

The brand name appears as the word **"Simplicity Builds"** and the email
`hello@simplicitybuilds.com`. To rebrand:

```bash
# from the repo root — replace with your chosen name / domain
grep -rl "Simplicity Builds" . --include="*.html" | xargs sed -i 's/Simplicity Builds/YourName/g'
grep -rl "simplicitybuilds.com" . --include="*.html" | xargs sed -i 's/simplicitybuilds\.com/yourdomain.com/g'
```

Then swap the mark in `assets/favicon.svg` if you want a different logo.
See [`BRAND.md`](BRAND.md) for name ideas and domain suggestions.

---

## Pricing model (the business behind the site)

See [`BRAND.md`](BRAND.md) → *Pricing strategy* for the full breakdown, margin
math, and positioning notes. Short version:

- **Launch $49.99/mo**, **Grow $69.99/mo**, **Scale $149.99/mo** — each with a
  one-time setup fee that's **waived on annual prepay**.
- **Own-It Build**: $799 one-time + $15/mo hosting, for clients who want to own
  outright.
- Add-on menu for everything else (SEO, e-commerce, extra pages, rush, etc.).
- Real cost per client on Vercel Pro ≈ **$3–5/mo** → ~90% gross margin on Launch.
- **Never** offer "unlimited edits" — the plans cap edits (2/5/priority) with
  $29 / 30-min overflow.
