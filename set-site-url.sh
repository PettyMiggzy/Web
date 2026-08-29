#!/usr/bin/env bash
# Point every absolute URL on the site (canonical, og:url, og:image, sitemap,
# robots) at one host. Run this the moment the real domain resolves.
#
#   ./set-site-url.sh https://simplicitybuilds.com
#
# Until a domain is registered, keep this pointed at the live Vercel URL so
# canonicals and social previews resolve to something real.
set -euo pipefail

NEW="${1:-}"
if [ -z "$NEW" ]; then
  echo "usage: ./set-site-url.sh https://your-domain.com" >&2
  exit 1
fi
NEW="${NEW%/}"   # strip trailing slash

CURRENT=$(grep -ho 'https://[a-z0-9.-]*\(vercel\.app\|simplicitybuilds\.com\)' index.html | head -1 || true)
if [ -z "$CURRENT" ]; then
  echo "Could not detect the current site URL in index.html" >&2
  exit 1
fi

echo "Rewriting $CURRENT  ->  $NEW"
grep -rl "$CURRENT" --include="*.html" --include="*.xml" --include="*.txt" . \
  | xargs sed -i "s|$CURRENT|$NEW|g"

echo "Done. Verify with:"
echo "  grep -rho 'https://[a-z0-9.-]*' --include='*.html' . | sort -u | head"
