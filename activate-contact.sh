#!/usr/bin/env bash
# Point the contact form at a form provider. Run once, then TEST IT before
# you walk away.
#
#   ./activate-contact.sh abcdefg
#
# The form ID is the part after /f/ in your Formspree endpoint.
#
# The phone arguments this script used to accept are gone: the site carries no
# phone markup any more, so accepting them would report success while changing
# nothing. To add a phone back, put the markup in the templates first.
set -euo pipefail

FORM_ID="${1:-}"
if [ -z "$FORM_ID" ]; then
  echo 'usage: ./activate-contact.sh <formspree_id>' >&2
  exit 1
fi
# Fail loudly rather than silently ignoring arguments that no longer do
# anything — a script that accepts input and drops it is worse than one that
# refuses it.
if [ $# -gt 1 ]; then
  echo 'error: this script takes only a form ID. The site no longer has phone' >&2
  echo '       markup, so a number passed here would change nothing.' >&2
  exit 1
fi

# In a sed replacement, & means "the whole match" and \ escapes. Without this,
# a value like "A&B" silently expands to the search text — the script would
# report success while writing something different. Escape before substituting.
sed_rhs() { printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'; }
FORM_ID_E=$(sed_rhs "$FORM_ID")

# 1. Wire the form endpoint
sed -i "s|https://formspree.io/f/YOUR_FORM_ID|https://formspree.io/f/${FORM_ID_E}|g" contact.html
echo "form endpoint  -> https://formspree.io/f/${FORM_ID}"

echo
echo "NOW TEST, in a browser, before you stop:"
echo "  Submit the contact form -> confirm the email actually arrives"
exit 0
