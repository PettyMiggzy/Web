#!/usr/bin/env bash
# Turn on the two lead channels the site is missing: a working form endpoint
# and a click-to-call number. Run once, then TEST BOTH before you walk away.
#
#   ./activate-contact.sh abcdefg "+15551234567" "(555) 123-4567"
#                          ^form   ^tel: href      ^what visitors see
#
# The form ID is the part after /f/ in your Formspree endpoint.
set -euo pipefail

FORM_ID="${1:-}"; TEL_HREF="${2:-}"; TEL_DISPLAY="${3:-}"
if [ -z "$FORM_ID" ] || [ -z "$TEL_HREF" ] || [ -z "$TEL_DISPLAY" ]; then
  echo 'usage: ./activate-contact.sh <formspree_id> "+15551234567" "(555) 123-4567"' >&2
  exit 1
fi

# 1. Wire the form endpoint
sed -i "s|https://formspree.io/f/YOUR_FORM_ID|https://formspree.io/f/${FORM_ID}|g" contact.html
echo "form endpoint  -> https://formspree.io/f/${FORM_ID}"

# 2. Swap every phone placeholder for the real number
grep -rl 'PHONE_HREF_PLACEHOLDER' --include="*.html" . \
  | xargs sed -i "s|PHONE_HREF_PLACEHOLDER|${TEL_HREF}|g"
grep -rl 'PHONE_DISPLAY_PLACEHOLDER' --include="*.html" . \
  | xargs sed -i "s|PHONE_DISPLAY_PLACEHOLDER|${TEL_DISPLAY}|g"
echo "phone number   -> ${TEL_DISPLAY} (${TEL_HREF})"

# 3. Reveal the phone links, which ship hidden so no fake number ever goes live
sed -i 's|{ display: none; } /\* phone \*/|{ display: inline-flex; } /* phone */|' css/styles.css
echo "phone links    -> now visible"

echo
echo "NOW TEST BOTH, in a browser, before you stop:"
echo "  1. Submit the contact form -> confirm the email actually arrives"
echo "  2. Tap the header phone link on a real phone -> confirm it dials"
