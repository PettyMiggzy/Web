#!/usr/bin/env node
/* =========================================================================
   Build a client or spec site from a profile.

     node new-site.js clients/joes-plumbing.json
     node new-site.js clients/*.json
     node new-site.js --list                 # show available verticals

   Output lands in dist/<slug>/index.html — a single self-contained file.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { buildSite, VERTICALS } = require('./templates/build');

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(`Usage: node new-site.js <profile.json> [more.json ...]
       node new-site.js --list

Profiles live in clients/. Start from clients/_example.json.`);
  process.exit(args.length ? 0 : 1);
}

if (args[0] === '--list') {
  console.log('Available verticals:\n');
  for (const [key, v] of Object.entries(VERTICALS)) {
    console.log(`  ${key.padEnd(14)} ${v.label}`);
  }
  process.exit(0);
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A slug becomes a directory name AND a public subdomain, so it must be a
// single safe path segment. A traversing slug ("../../x") would write outside
// dist/; an empty one ("!!!" slugifies to "") would clobber dist/index.html and
// then be silently skipped when publishing. Reject both loudly rather than
// write somewhere surprising.
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
function assertSafeSlug(slug, source) {
  if (!slug) {
    throw new Error(
      `could not derive a slug from name "${source}" — add an explicit "slug" field (lowercase letters, digits and hyphens)`
    );
  }
  if (!SAFE_SLUG.test(slug)) {
    throw new Error(
      `unsafe slug "${slug}" — must be lowercase letters, digits and hyphens only, 1-63 chars, no leading/trailing hyphen`
    );
  }
}

let built = 0;
let failed = 0;

for (const file of args) {
  try {
    const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
    const html = buildSite(profile);
    const slug = profile.slug || slugify(profile.name);
    assertSafeSlug(slug, profile.name);
    const outDir = path.join('dist', slug);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'index.html');
    fs.writeFileSync(outFile, html);
    const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(
      `  built  ${outFile.padEnd(42)} ${String(kb).padStart(6)} KB  [${profile.vertical}${profile.spec ? ', spec' : ''}]`
    );
    built++;
  } catch (err) {
    console.error(`  FAILED ${file}: ${err.message}`);
    failed++;
  }
}

console.log(`\n${built} built${failed ? `, ${failed} failed` : ''}.`);
process.exit(failed ? 1 : 0);
