#!/usr/bin/env bash
# =========================================================================
# check-dns.sh — verify the domain's web and mail legs in one pass.
#
#   ./check-dns.sh [domain]     (default: simplicitybuilds.com)
#
# Exits 1 if MAIL is broken, so it can gate a deploy or run in CI. Web
# problems warn but don't fail the run: the site can be mid-migration while
# mail is fine, and a redirect tweak shouldn't block anything.
#
# Uses DNS-over-HTTPS rather than dig — dig isn't installed everywhere, and
# DoH also sidesteps a stale local resolver cache, which matters when you're
# watching records you changed minutes ago.
# =========================================================================
set -uo pipefail

DOMAIN="${1:-simplicitybuilds.com}"
FAIL=0
WARN=0

c_ok=$'\033[32m'; c_bad=$'\033[31m'; c_warn=$'\033[33m'; c_dim=$'\033[2m'; c_off=$'\033[0m'
[ -t 1 ] || { c_ok=; c_bad=; c_warn=; c_dim=; c_off=; }

ok()   { printf '  %sPASS%s  %s\n' "$c_ok"   "$c_off" "$1"; }
bad()  { printf '  %sFAIL%s  %s\n' "$c_bad"  "$c_off" "$1"; FAIL=1; }
warn() { printf '  %sWARN%s  %s\n' "$c_warn" "$c_off" "$1"; WARN=1; }
note() { printf '        %s%s%s\n' "$c_dim" "$1" "$c_off"; }

# --- how we'll resolve ----------------------------------------------------
# Ordered by what a plain server actually has. dig is best when present, but
# it isn't installed on a stock Ubuntu image; python3 always is. Requiring
# node would mean this can't run on the very boxes you'd want to check from.
command -v curl >/dev/null 2>&1 || {
  echo "check-dns.sh needs curl. Install it:  apt-get install -y curl" >&2; exit 2; }

if command -v dig >/dev/null 2>&1; then          RESOLVER=dig
elif command -v python3 >/dev/null 2>&1; then    RESOLVER=python3
elif command -v node >/dev/null 2>&1; then       RESOLVER=node
else
  echo "check-dns.sh needs one of: dig, python3, or node — to read DNS answers." >&2
  echo "  apt-get install -y dnsutils      # or python3" >&2
  exit 2
fi

# Strip a JSON DoH response down to one answer per line.
_parse() {
  case "$RESOLVER" in
    python3) python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit(1)
for a in d.get("Answer",[]):
    print(str(a.get("data","")).strip("\""))
' ;;
    node) node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  try{ (JSON.parse(s).Answer||[]).forEach(a=>console.log(String(a.data).replace(/^"|"$/g,""))) }
  catch(e){ process.exit(1) }});' ;;
  esac
}

# Resolve one record type. Prints one answer per line, empty if none.
# Two resolvers are tried in turn so a single hiccup doesn't read as "the
# record is missing" — a false FAIL here would send someone editing DNS
# that was already correct.
resolve() {
  local name="$1" type="$2" out
  if [ "$RESOLVER" = dig ]; then
    # @resolver explicitly: the box's own /etc/resolv.conf may point at a
    # caching resolver still holding records you changed minutes ago.
    for ns in 1.1.1.1 8.8.8.8; do
      out=$(dig +short +time=5 +tries=1 "$type" "$name" "@$ns" 2>/dev/null) || continue
      [ -n "$out" ] && { printf '%s\n' "$out" | sed 's/^"//;s/"$//'; return 0; }
    done
    return 0
  fi
  for endpoint in \
    "https://cloudflare-dns.com/dns-query" \
    "https://dns.google/resolve"; do
    out=$(curl -sf --max-time 12 -H 'accept: application/dns-json' \
      "${endpoint}?name=${name}&type=${type}" 2>/dev/null) || continue
    printf '%s' "$out" | _parse && return 0
  done
  return 0
}

printf '\n%s=== %s ===%s\n' "$c_dim" "$DOMAIN" "$c_off"

# ---------- WEB ----------
printf '\nWeb\n'

ns=$(resolve "$DOMAIN" NS)
if [ -z "$ns" ]; then
  warn "no NS records — domain may not be registered"
elif printf '%s' "$ns" | grep -qi 'domaincontrol\.com'; then
  ok "nameservers at GoDaddy $(printf '%s' "$ns" | tr '\n' ' ')"
else
  warn "nameservers are NOT GoDaddy: $(printf '%s' "$ns" | tr '\n' ' ')"
  note "if this was unintentional, MX records were likely dropped with them"
fi

a=$(resolve "$DOMAIN" A)
[ -n "$a" ] && ok "A $DOMAIN -> $(printf '%s' "$a" | tr '\n' ' ')" \
             || warn "no A record for $DOMAIN"

# Retry before complaining. A single failed fetch is far more often a flaky
# egress path than a down site, and a false "site is down" sends someone
# debugging DNS that was fine all along.
code=""; final=""
for attempt in 1 2 3; do
  read -r code final <<<"$(curl -sL --max-time 25 -o /dev/null \
    -w '%{http_code} %{url_effective}' "https://$DOMAIN" 2>/dev/null)"
  [ "$code" = "200" ] && break
  [ "$attempt" -lt 3 ] && sleep 2
done
if [ "$code" = "200" ]; then
  ok "https://$DOMAIN -> 200 ($final)"
else
  warn "https://$DOMAIN -> ${code:-no response} after 3 tries"
fi

# A canonical that points at a URL which redirects still resolves for Google,
# but it splits signals between two hostnames. Worth surfacing, not failing.
if [ -f index.html ]; then
  canon=$(grep -o 'rel="canonical" href="[^"]*"' index.html | head -1 | sed 's/.*href="//;s/"//')
  if [ -n "$canon" ] && [ -n "$final" ]; then
    ch=$(printf '%s' "$canon" | sed 's#https\?://##;s#/.*##')
    fh=$(printf '%s' "$final" | sed 's#https\?://##;s#/.*##')
    # Only meaningful when this repo actually is the domain under test —
    # otherwise we'd compare a checked domain against an unrelated repo's tags.
    if [ "${ch#www.}" = "${DOMAIN#www.}" ]; then
      [ "$ch" = "$fh" ] && ok "canonical host matches served host ($ch)" \
                        || warn "canonical says '$ch' but the site serves '$fh'"
    else
      note "skipping canonical check — this repo's tags are for $ch, not $DOMAIN"
    fi
  fi
fi

# ---------- MAIL ----------
printf '\nMail\n'

mx=$(resolve "$DOMAIN" MX)
# RFC 7505: a single MX of "." is a null MX — an explicit declaration that the
# domain handles no mail at all. It answers like a normal record, so treating
# any non-empty MX as success would report a mail-less domain as healthy.
mx_hosts=$(printf '%s' "$mx" | sed 's/^[0-9]* *//' | grep -v '^\.\?$' || true)
if [ -z "$mx" ]; then
  bad "no MX records — inbound mail to @$DOMAIN bounces"
elif [ -z "$mx_hosts" ]; then
  bad "null MX (RFC 7505) — $DOMAIN declares it handles no mail"
else
  ok "MX -> $(printf '%s' "$mx" | tr '\n' ' ')"
fi

spf=$(resolve "$DOMAIN" TXT | grep -i '^v=spf1' || true)
if [ -z "$spf" ]; then
  bad "no SPF record — your mail can't prove it's yours"
else
  # An SPF with no include/ip4/ip6/a/mx mechanism authorizes nobody. Valid
  # syntax, and correct for a domain that never sends — but broken for one
  # that does, so it must not read as PASS.
  if printf '%s' "$spf" | grep -qiE '(include:|ip4:|ip6:|[[:space:]](a|mx)([[:space:]]|$))'; then
    ok "SPF -> $spf"
    printf '%s' "$spf" | grep -q '+all' && warn "SPF ends in +all — that authorizes the whole internet"
  else
    bad "SPF authorizes no senders ($spf) — every message you send fails SPF"
  fi
fi

# Providers use different selectors; probe the common ones rather than
# reporting "no DKIM" for a setup that simply names its key differently.
dkim=""
revoked=""
for sel in selector1 selector2 default google k1 s1 mail; do
  hit=$(resolve "${sel}._domainkey.${DOMAIN}" CNAME)
  kind=CNAME
  [ -z "$hit" ] && { hit=$(resolve "${sel}._domainkey.${DOMAIN}" TXT); kind=TXT; }
  [ -z "$hit" ] && continue

  # RFC 6376: a key record with an empty p= is a REVOKED key. It resolves
  # like a live one, so accepting any answer here would report a revoked
  # key as working DKIM.
  if [ "$kind" = TXT ] && printf '%s' "$hit" | grep -qE 'p=[[:space:]]*(;|$)'; then
    revoked="$sel"
    continue
  fi

  dkim="$sel"
  ok "DKIM ($sel) -> $(printf '%s' "$hit" | head -1 | cut -c1-60)"
  break
done
if [ -z "$dkim" ]; then
  [ -n "$revoked" ] && bad "DKIM key at '$revoked' is REVOKED (empty p=) — signing is off" \
                    || bad "no DKIM found (probed: selector1/2, default, google, k1, s1, mail)"
fi

dmarc=$(resolve "_dmarc.$DOMAIN" TXT | grep -i '^v=DMARC1' || true)
if [ -z "$dmarc" ]; then
  warn "no DMARC record"
else
  pol=$(printf '%s' "$dmarc" | grep -o 'p=[a-z]*' | head -1 | cut -d= -f2)
  if [ "$pol" = "none" ]; then
    ok "DMARC p=none (monitoring only)"
  elif [ -n "$spf" ] && [ -n "$dkim" ]; then
    ok "DMARC p=$pol, and SPF+DKIM are present to satisfy it"
  else
    # The dangerous combination, and the reason this script exists: an
    # enforcing policy with nothing able to pass it silently spam-files
    # every message you send.
    bad "DMARC p=$pol but SPF or DKIM is MISSING — outbound mail will be filtered"
    note "fix SPF/DKIM, or set p=none until they resolve"
  fi
fi

printf '\n'
if [ "$FAIL" -ne 0 ]; then
  printf '%sMail is not ready.%s Fix the FAIL lines above before emailing anyone.\n\n' "$c_bad" "$c_off"
  exit 1
fi
[ "$WARN" -ne 0 ] && printf '%sMail looks good%s (some web warnings above).\n\n' "$c_ok" "$c_off" \
                  || printf '%sAll good.%s\n\n' "$c_ok" "$c_off"
printf 'Send a real test message and confirm SPF/DKIM/DMARC all PASS in\n'
printf "Gmail's \"Show original\" — that is the only proof that counts.\n\n"
exit 0
