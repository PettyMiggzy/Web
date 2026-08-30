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

let built = 0;
let failed = 0;

for (const file of args) {
  try {
    const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
    const html = buildSite(profile);
    const slug = profile.slug || slugify(profile.name);
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
