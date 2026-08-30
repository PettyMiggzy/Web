#!/usr/bin/env bash
# Turn on the two lead channels the site is missing: a working form endpoint
# and a click-to-call number. Run once, then TEST BOTH before you walk away.
#
#   ./activate-contact.sh abcdefg "+15551234567" "(555) 123-4567"
#                          ^form   ^tel: href      ^what visitors see
#
# The form ID is the part after /f/ in your Formspree endpoint.
#
# The phone arguments are optional — launching with a working form and no
# phone is a normal state. Omit them and the phone links simply stay hidden,
# which is the safe default: a placeholder number must never reach a visitor.
# Re-run later with all three to switch the phone on.
set -euo pipefail

FORM_ID="${1:-}"; TEL_HREF="${2:-}"; TEL_DISPLAY="${3:-}"
if [ -z "$FORM_ID" ]; then
  echo 'usage: ./activate-contact.sh <formspree_id> ["+15551234567" "(555) 123-4567"]' >&2
  exit 1
fi
# Both phone parts or neither — one without the other yields a link that
# displays one thing and dials another.
if { [ -n "$TEL_HREF" ] && [ -z "$TEL_DISPLAY" ]; } || { [ -z "$TEL_HREF" ] && [ -n "$TEL_DISPLAY" ]; }; then
  echo 'error: give BOTH the tel: href and the display number, or neither.' >&2
  exit 1
fi

# In a sed replacement, & means "the whole match" and \ escapes. Without this,
# a value like "A&B" silently expands to the search text — the script would
# report success while writing something different. Escape before substituting.
sed_rhs() { printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'; }
FORM_ID_E=$(sed_rhs "$FORM_ID")
TEL_HREF_E=$(sed_rhs "$TEL_HREF")
TEL_DISPLAY_E=$(sed_rhs "$TEL_DISPLAY")

# 1. Wire the form endpoint
sed -i "s|https://formspree.io/f/YOUR_FORM_ID|https://formspree.io/f/${FORM_ID_E}|g" contact.html
echo "form endpoint  -> https://formspree.io/f/${FORM_ID}"

if [ -n "$TEL_HREF" ]; then
  # 2. Swap every phone placeholder for the real number
  grep -rl 'PHONE_HREF_PLACEHOLDER' --include="*.html" . \
    | xargs sed -i "s|PHONE_HREF_PLACEHOLDER|${TEL_HREF_E}|g"
  grep -rl 'PHONE_DISPLAY_PLACEHOLDER' --include="*.html" . \
    | xargs sed -i "s|PHONE_DISPLAY_PLACEHOLDER|${TEL_DISPLAY_E}|g"
  echo "phone number   -> ${TEL_DISPLAY} (${TEL_HREF})"

  # 3. Reveal the phone links, which ship hidden so no fake number ever goes live
  sed -i 's|{ display: none; } /\* phone \*/|{ display: inline-flex; } /* phone */|' css/styles.css
  echo "phone links    -> now visible"
else
  echo "phone number   -> skipped (links stay hidden; no placeholder goes live)"
fi

echo
echo "NOW TEST, in a browser, before you stop:"
echo "  1. Submit the contact form -> confirm the email actually arrives"
# An `[ ... ] && echo` here would be the script's last command, and a false
# test makes it the exit status — a successful run reporting failure.
if [ -n "$TEL_HREF" ]; then
  echo "  2. Tap the header phone link on a real phone -> confirm it dials"
fi
exit 0
