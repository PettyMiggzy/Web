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

## Domain checking (Porkbun)

`lib/domain-check.js` holds the logic; `api/domain-check.js` (Vercel) and
`functions/api/domain-check.js` (Cloudflare) are thin adapters over it. Both
exist because **Vercel runs `api/` and ignores `functions/`, and Cloudflare
does the reverse** — shipping only the Cloudflare one meant the endpoint
404'd in production while passing every local test. Keeping the logic in one
module is what stops a fix reaching one host and missing the other.

It checks domain availability and returns **at-cost** registrar pricing. The contact page
uses it as step one of onboarding, because "go buy a domain" is the single
biggest reason a project stalls for weeks.

Why Porkbun rather than GoDaddy: GoDaddy's Availability API requires **50+
domains in the account**. Reaching that by buying cheap TLDs is a trap — .xyz
registers at $2.04 and *renews* at $14.21 (live figures, Aug 2026), so twenty
of them is roughly $280/year, forever, since letting them lapse drops you back
under the gate. Porkbun's API has no minimum, no fee, and a free sandbox.

Switch it on:

```bash
wrangler pages secret put PORKBUN_API_KEY      # pk1_sb_… for the sandbox
wrangler pages secret put PORKBUN_SECRET_KEY   # sk1_sb_…
```

Credentials live in Cloudflare env vars and never reach the browser — that is
why this is a server-side function rather than a fetch from the page. **With no
keys configured it still returns real pricing and says plainly that
availability checking is off; it never guesses, and never reports a name as
free when it doesn't know.**

Guards: business names are normalised to a valid DNS label (accents stripped,
`&` becomes "and", 63-char cap) and rejected if they don't match, so nothing
unvalidated reaches the upstream URL. The TLD list can be narrowed by the
caller but never widened past the four-item allowlist. Upstream calls have a
10-second ceiling, one TLD failing doesn't sink the others, and results are
rendered with `textContent` — a hostile API response cannot inject markup
(verified: 0 dialogs, no injected elements).

**Commercial note.** Pass domains through at cost and register them in the
client's name. Reselling via GoDaddy's reseller programme routes registrations
through Wild West Domains as registrar of record, and domains cannot be pushed
between Wild West Domains and GoDaddy — which is a weaker version of the
lock-in this business exists to argue against. See BRAND.md.

---

## Spec sites & hosting (Cloudflare Pages)

**Hosting note.** Vercel's Fair Use Guidelines restrict Hobby to
"non-commercial personal use only", and define commercial usage to include
"advertising the sale of a product or service" and "receiving payment to
create, update, or host the site". Both this site and every client site are
commercial under that definition, so the options are Vercel Pro ($20/mo) or
Cloudflare Pages (free, no equivalent clause). `_headers` and `_redirects`
port the `vercel.json` rules to Pages; both configs can coexist.

**Spec sites** are previews built for one named prospect and sent to them
directly — never a public free tier, never listed on the pricing page.

```bash
cp clients/_example.json clients/joes-plumbing.json   # fill from their GBP
./deploy-spec.sh --build-only                          # inspect spec/sites/
./deploy-spec.sh                                       # publish
#   -> https://joes-plumbing.simplicitybuilds.com
```

All previews live in **one** Pages project (`spec/`) behind a single wildcard
custom domain, so prospect fifty needs no new project and no new DNS record.
`spec/functions/_middleware.js` maps `<slug>.simplicitybuilds.com` to
`/sites/<slug>/`. It refuses to rewrite the apex, `www`, mail-related
subdomains, deeper nestings, and any malformed slug — so it can never shadow
the marketing site or the mailbox. Unknown slugs get a branded 404.

Spec sites are noindexed three times over: `noindex,nofollow` in the template,
an `X-Robots-Tag` header on every response, and a blanket `Disallow: /` in
`spec/robots.txt`. An unsold preview of someone's real business must never
reach Google.

One-time setup: `npm i -g wrangler && wrangler login`, create a Pages project
named `simplicity-spec`, add `*.simplicitybuilds.com` as a custom domain, then
add a proxied `CNAME * -> simplicity-spec.pages.dev` in GoDaddy DNS. Free-tier
ceilings that matter: 500 builds/month and 100 projects (this design uses one).

---

## Domain & DNS (simplicitybuilds.com)

DNS is managed **at GoDaddy**, not Vercel. This is deliberate: the mailbox
(`team@simplicitybuilds.com`) is GoDaddy-hosted, and switching nameservers to
Vercel would drop the MX records and break email. Vercel's own docs warn that
changing nameservers requires re-creating every record you want to keep. **Never
change the nameservers off `ns45/ns46.domaincontrol.com`.**

Web DNS is **already live** (verified Aug 2026):

| Record | Value              | Note                                    |
|--------|--------------------|-----------------------------------------|
| NS     | `*.domaincontrol.com` | GoDaddy — leave alone                |
| A `@`  | `216.150.1.1`      | Vercel anycast                          |
| CNAME `www` | → apex        | apex 308-redirects to `www`             |

Note the redirect direction: the apex sends visitors to **www**, while every
canonical in the HTML is written **without** www. Either set the apex as primary
in **Vercel → Settings → Domains** (no code change, matches the HTML), or run
`./set-site-url.sh https://www.simplicitybuilds.com` to rewrite the tags. Don't
do both.

### Mail

Mail runs on GoDaddy Email & Office. The wizard writes MX, SPF and DKIM
automatically when the domain and mailbox are in the same GoDaddy account.

**GoDaddy pre-seeds a `_dmarc` TXT record at `p=quarantine` before any mailbox
exists.** That policy tells receivers to spam-file anything failing
authentication — so between registering the domain and finishing the mail
wizard, there is a window where SPF and DKIM don't exist yet and outbound mail
can be silently quarantined. Verify all three legs before trusting the inbox;
if SPF or DKIM is missing, drop DMARC to `p=none` until they resolve, then
tighten it back.

Verify the whole chain:

```bash
./check-dns.sh                 # web + MX/SPF/DKIM/DMARC, exit 1 if mail is broken
```

Three PASSes (SPF, DKIM, DMARC) in Gmail's **Show original** on a real test
message is the only proof that counts.

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

## Contact form & phone

**The form is live** — it posts to Formspree and a submission was verified
accepted end to end (`{"ok":true}`, HTTP 200). Leads arrive at the address
configured in the Formspree dashboard.

To change providers:

```bash
./activate-contact.sh <formspree_id>
```

**There is no phone number on this site, by design** — the business runs on
email. The `tel:` markup and its CSS were removed entirely rather than left
hidden, so no placeholder number can surface if a stylesheet is ever edited.
`activate-contact.sh` now rejects phone arguments instead of accepting them
and silently doing nothing. To reintroduce a phone, add the markup first.

If the endpoint is ever reset to `YOUR_FORM_ID`, the form stops submitting and
tells the visitor plainly to email instead. That fallback is deliberate: a form
that silently swallows a lead while showing a success message is worse than one
that admits it is offline.

**How it submits.** Over `fetch`, so the visitor gets an inline thank-you and
stays on the site rather than being handed to the provider's own thank-you
page. The `action` and `method` are still on the `<form>`, so with JS disabled
it posts natively and the lead still arrives — the script is an enhancement,
never the only path.

Deliberately **no** `@formspree/ajax`. It would be the only third-party script
on the site, for behaviour that is ~50 lines against an API the codebase
already calls the same way elsewhere. Every failure mode is covered instead:
provider validation errors are surfaced verbatim, a network failure says so and
offers the mailbox, and neither ever renders as success. Error text from the
provider is written with `textContent` — verified a hostile response injects
nothing (0 dialogs, 0 elements, shown as literal text).

---

## SEO

The honest constraint: a domain this new **cannot rank for "web design"**.
Those terms belong to agencies with a decade of backlinks. What is winnable is
long-tail with buying intent, where the five vertical templates are an actual
advantage rather than marketing.

`websites-for/` holds one page per trade — plumbers, cafés, salons, shops,
clinics. Each targets what that trade's customers search and what their site
has to do, and each is written separately: **worst pairwise vocabulary overlap
is 27%**, checked on every build.

That number matters. Near-identical pages spun out per keyword are *doorway
pages*, and Google penalises them sitewide rather than just ignoring them. Five
genuinely different pages is fine; five hundred city×trade permutations would
get the whole domain demoted. **Do not generate these mechanically** — if a new
trade page cannot say something the others do not, it should not exist.

Every page carries `FAQPage` and `BreadcrumbList` JSON-LD, and each is linked
from the home and services pages so it gets crawled and receives internal link
equity.

Schema coverage is now complete: `ProfessionalService` + `FAQPage` on home,
`Product` on pricing, `Service` on services, `AboutPage`, `ContactPage`,
`CollectionPage`, and per-vertical `FAQPage` + `BreadcrumbList`.

---

## Showing reviews

`index.html` has a `#reviews` section between the promise section and the FAQ,
which is where a hesitant reader actually is. It ships with the `hidden`
attribute because there are no reviews yet — an empty "What clients say"
heading is worse than no heading.

Adding one is two steps, both documented in a comment inside the section:
paste a `<figure class="review">` block, then delete `hidden`.

**Never write one yourself.** A testimonial you invented is a fabricated
endorsement of a real business, and the first client who reads it will know it
was not them.

Reviews are plain HTML rather than JS-rendered, so they are indexable.

**Do not add `Review` or `AggregateRating` JSON-LD for these.** Google does not
support review snippets where the reviewed entity is the same site hosting
them — self-serving reviews about your own `Organization` are ineligible, so
the markup buys no stars and only invites a manual action. Stars in search come
from third-party reviews, which for this business means a **Google Business
Profile**. Reviews on this page are for the human reading them.

---

## Collecting reviews

`/review` is the page to send a client once their site has been running a
few weeks. It posts to the same Formspree endpoint as the quote form, tagged
`form_type=review`, so it needs no extra setup.

**Nothing publishes itself.** Reviews arrive by email and go on the site by
hand. An auto-publishing form on your own marketing site is an open invitation
to whatever a stranger wants to write there.

The consent checkbox is **not required**. Someone who wants to tell you the
work was poor should be able to, without also having to authorise you quoting
them — a form that only accepts publishable praise is not collecting feedback,
it is collecting marketing copy.

Star rating is a real radio group, not clickable glyphs: it works with
JavaScript off, it is keyboard reachable, and a screen reader announces the
rating rather than a decorative character. The submit handler is shared with
the contact form, so the "never report success for something that did not
send" guarantee holds here too — and a review deliberately does **not** fire
the ad conversion, or the ad platform would start optimising for people
leaving feedback instead of buying.

---

## Taking payment

Hosted **payment links** — no secret key, no server, no card data near our
code. Each plan button is an anchor to the provider's hosted checkout, which
handles subscriptions, receipts, failed-payment retries and the customer
portal.

**The provider is interchangeable.** `js/checkout.js` holds URLs, so Square,
Stripe and PayPal all work the same way: create one link per plan and interval
in whichever dashboard, paste the URLs in. Nothing else in the codebase knows
which provider is behind them.

- **Square** — Dashboard → Online → Payment Links → Create → *Accept recurring
  payments*.
- **Stripe** — Dashboard → Payment links → New. Products and prices already
  exist in the live account.

Do not use Zelle or a bank transfer for a subscription. There is no recurring
charge, so every client has to remember to pay you each month — that is twenty
monthly reminders you have to chase, and each one is a fresh chance for them
to reconsider. Most banks also prohibit business use on personal Zelle, and
transfers are irreversible with no record trail for accounting.

Worth enabling on the bigger plans: **ACH debit** is 0.8% capped at $5 versus
2.9% + 30¢ on cards. On Scale that is $1.20 instead of $4.65, and bank debits
fail less often than cards — which quietly reduces involuntary churn.

---

## Taking payment (Stripe)

Stripe **Payment Links** — no secret key, no server, no card data touching our
code. Each plan button is an anchor to Stripe's hosted checkout, which handles
subscriptions, receipts, failed-payment retries and the customer portal.

`js/checkout.js` holds every link in one place, split TEST / LIVE. **Test links
are used only on localhost.** A test link served to a real visitor would walk
them through a checkout that cannot charge them, so the hostname decides, not a
flag someone can forget to flip. Any plan without a live URL keeps its
`/contact` href — an unconfigured plan sends someone to a human, never to a
dead or wrong-priced checkout.

The monthly/annual toggle re-points the buttons as well as the displayed price.
Those two must move together: showing an annual figure beside a button that
charges monthly bills the visitor something other than the number they were
reading.

Notes from the Stripe implementation planner:

- `managed_payments: {enabled: false}` on every link. Managed Payments is on by
  default on the account, but it requires a digital-goods tax code, and
  `txcd_10701200` (Website Design) is a **service** — Stripe rejects the link
  otherwise.
- **`automatic_tax` stays off.** With no tax registration, enabling it means
  Stripe collects nothing while you believe tax is handled. The product tax
  code instead switches on free threshold monitoring, which warns you before
  you cross into owing tax anywhere.
- No `payment_method_types` — omitting it enables dynamic payment methods,
  which pick the highest-converting options per customer.

---

## Running paid ads

`js/analytics.js` holds every tracking ID in one `CONFIG` block. **Empty values
mean nothing loads** — no script, no cookie, no request — which is how it
ships, so the site stays free of third-party JS until you actually buy traffic.

```js
var CONFIG = {
  ga4: "G-XXXXXXXXXX",        // Google Analytics 4
  ads: "AW-XXXXXXXXX",        // Google Ads account
  adsLabel: "AW-XXXXXXXXX/AbC…",  // send_to from the conversion action
  meta: "123456789012345",    // Meta pixel
};
```

**`adsLabel` is not optional if you want bidding to work.** With `ads` set but
no label, Google Ads records nothing — that is the single most common reason a
campaign reports zero conversions while clearly receiving leads.

The conversion fires **only after the form provider confirms it accepted the
lead** — never on click. Firing on click would count abandoned and failed
submissions, and Smart Bidding would optimise toward traffic that never becomes
a customer. Verified: fires once on success with the plan and its dollar value,
and does not fire on a validation error or a network failure.

Before spending anything, two things are worth knowing:

- **Generic "web design" keywords are brutal.** Roughly $5–20 a click, so at a
  2–4% conversion rate a lead costs $150–800 and a customer $600–3,000. At
  $49.99/mo that can take 20+ months to recoup. Long-tail geo terms
  ("website for plumbers in Indianapolis") and cheap local Meta targeting cost
  a fraction.
- **Advertise the free mockup, not the subscription.** "See your website before
  you pay anything" is the one offer competitors can't match, because for them
  a spec build costs a day and for us it costs minutes.

`privacy.html` documents the tracking and how to opt out, and `terms.html`
covers recurring billing, cancellation and ownership — ad platforms want both
for a subscription offer.

---

## Rename the brand (once you've chosen a name)

The brand name appears as the word **"Simplicity Builds"** and the email
`team@simplicitybuilds.com`. To rebrand:

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
