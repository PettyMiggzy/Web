#!/usr/bin/env bash
# =========================================================================
# add-review.sh — put a client review on the home page.
#
#   ./add-review.sh "Paul Wells" "Wells Safety LLC" 5 "Their words here."
#
# Reads the four fields straight off the review email, writes the card into
# index.html, and unhides the reviews section if this is the first one.
#
# ONLY run this for a review where the client ticked "you may publish this".
# The consent box is in the submission; if it says no, you have feedback you
# can act on and nothing you may quote.
#
# Never invent one. A testimonial you wrote is a fabricated endorsement of a
# real business, and the person it names will know it wasn't them.
# =========================================================================
set -euo pipefail

NAME="${1:-}"; BUSINESS="${2:-}"; RATING="${3:-}"; TEXT="${4:-}"
PAGE="index.html"

if [ -z "$NAME" ] || [ -z "$BUSINESS" ] || [ -z "$RATING" ] || [ -z "$TEXT" ]; then
  cat >&2 <<'USAGE'
usage: ./add-review.sh "<name>" "<business>" <rating 1-5> "<review text>"

  Copy each value from the review email. Quote every argument.
  Example:
    ./add-review.sh "Paul Wells" "Wells Safety LLC" 5 "Top notch work."
USAGE
  exit 1
fi

case "$RATING" in
  1|2|3|4|5) ;;
  *) echo "error: rating must be a whole number 1-5, got '$RATING'" >&2; exit 1 ;;
esac

[ -f "$PAGE" ] || { echo "error: run this from the repo root ($PAGE not found)" >&2; exit 1; }
grep -q 'id="reviews"' "$PAGE" || { echo "error: no #reviews section in $PAGE" >&2; exit 1; }

# Refuse a duplicate rather than quietly printing the same person twice.
if grep -qF "<strong>$NAME</strong>" "$PAGE"; then
  echo "error: a review from '$NAME' is already on the page." >&2
  echo "       Edit $PAGE by hand if you meant to change it." >&2
  exit 1
fi

# The review text is client-supplied and goes into HTML, so & < > must be
# escaped or a stray character silently breaks the page markup.
NAME="$NAME" BUSINESS="$BUSINESS" RATING="$RATING" TEXT="$TEXT" PAGE="$PAGE" python3 - <<'PY'
import html, os, re, sys

name  = html.escape(os.environ['NAME'].strip())
biz   = html.escape(os.environ['BUSINESS'].strip())
rating = int(os.environ['RATING'])
text  = html.escape(os.environ['TEXT'].strip())
page  = os.environ['PAGE']

card = (
 '          <figure class="review">\n'
 f'            <div class="stars" aria-label="Rated {rating} out of 5">{"★" * rating}</div>\n'
 '            <blockquote>\n'
 f'              <p>{text}</p>\n'
 '            </blockquote>\n'
 f'            <figcaption><strong>{name}</strong><span>{biz}</span></figcaption>\n'
 '          </figure>\n'
)

s = open(page, encoding='utf-8').read()
before = s

if '          <!-- review blocks go here -->\n' in s:
    s = s.replace('          <!-- review blocks go here -->\n', card, 1)
else:
    # Append after the last existing card so ordering stays predictable.
    m = list(re.finditer(r'          </figure>\n', s))
    if not m:
        sys.exit('error: could not find where to insert the review')
    i = m[-1].end()
    s = s[:i] + card + s[i:]

# First review: reveal the section.
s = s.replace('<section class="section-tight" id="reviews" hidden>',
              '<section class="section-tight" id="reviews">')

if s == before:
    sys.exit('error: nothing changed — check the page structure')

open(page, 'w', encoding='utf-8').write(s)
print(f'  added: {rating}★  {name} — {biz}')
PY

# Count only published cards. A naive grep also matches any example inside an
# HTML comment, which would report more reviews than are actually on the page.
COUNT=$(python3 -c "
import re,sys
h=open('$PAGE',encoding='utf-8').read()
print(len(re.findall(r'<figure class=\"review\">', re.sub(r'<!--[\s\S]*?-->','',h))))
")
echo "  $PAGE now shows $COUNT review(s)"
echo
echo "Check it before you push:"
echo "  npx serve .   then open http://localhost:3000 and scroll to \"What clients say\""
exit 0
