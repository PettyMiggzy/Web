#!/usr/bin/env bash
# Build every client profile and publish the spec-site project to Cloudflare
# Pages. One project, one wildcard domain, any number of previews.
#
#   ./deploy-spec.sh                 # build all profiles + deploy
#   ./deploy-spec.sh --build-only    # build, don't deploy (inspect spec/sites/)
#
# First-time setup (once):
#   1. npm i -g wrangler && wrangler login
#   2. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> project
#      named "simplicity-spec"
#   3. That project -> Custom domains -> add  *.simplicitybuilds.com
#   4. GoDaddy DNS -> CNAME  *  ->  simplicity-spec.pages.dev  (proxied)
#
# A wildcard costs one custom domain, so prospect number fifty needs no DNS
# work at all. Pages caps a free account at 100 PROJECTS, which this design
# never approaches, and 500 builds/month, which is the real ceiling here.
set -euo pipefail

PROJECT="${SPEC_PAGES_PROJECT:-simplicity-spec}"
BUILD_ONLY=false
[ "${1:-}" = "--build-only" ] && BUILD_ONLY=true

# --- build every profile into spec/sites/<slug>/ -------------------------
shopt -s nullglob
profiles=(clients/*.json)
profiles=("${profiles[@]/clients\/_example.json}")   # skip the template
profiles=($(printf '%s\n' "${profiles[@]}" | grep -v '^$' || true))

if [ ${#profiles[@]} -eq 0 ]; then
  echo "No profiles in clients/. Copy clients/_example.json and fill it in." >&2
  exit 1
fi

rm -rf spec/sites
mkdir -p spec/sites

echo "Building ${#profiles[@]} site(s):"
node new-site.js "${profiles[@]}"

# new-site.js writes to dist/<slug>/; move those into the Pages project.
for d in dist/*/; do
  slug=$(basename "$d")
  mkdir -p "spec/sites/$slug"
  cp "$d/index.html" "spec/sites/$slug/index.html"
done

count=$(find spec/sites -name index.html | wc -l | tr -d ' ')
echo
echo "$count site(s) staged in spec/sites/"

if $BUILD_ONLY; then
  echo "Build-only: skipping deploy."
  exit 0
fi

# --- deploy --------------------------------------------------------------
if ! command -v wrangler >/dev/null 2>&1; then
  echo
  echo "wrangler not found. Install it, then re-run:" >&2
  echo "  npm i -g wrangler && wrangler login" >&2
  exit 1
fi

echo "Deploying to Pages project: $PROJECT"
wrangler pages deploy spec --project-name "$PROJECT" --commit-dirty=true

echo
echo "Live previews:"
for d in spec/sites/*/; do
  echo "  https://$(basename "$d").simplicitybuilds.com"
done
echo
echo "Check one in a browser before you send it to anyone."
