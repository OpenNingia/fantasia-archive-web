#!/usr/bin/env bash
#
# Registers a local-auth user against the dev backend.
# Usage:
#   ./scripts/register-user.sh <email> <password> <displayName>
#   ./scripts/register-user.sh -e foo@bar.com -p s3cret123 -n "Foo Bar"
#
# Optional env:
#   API_URL       defaults to http://localhost:3000
#   COOKIE_JAR    if set, auth cookies are saved to this path (curl -c)
#
# Backend must have LOCAL_AUTH_ENABLED=true (the dev compose sets this).

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
EMAIL=""
PASSWORD=""
DISPLAY_NAME=""

print_usage () {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
}

# Flag parsing
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--email)        EMAIL="$2"; shift 2 ;;
    -p|--password)     PASSWORD="$2"; shift 2 ;;
    -n|--display-name) DISPLAY_NAME="$2"; shift 2 ;;
    -h|--help)         print_usage; exit 0 ;;
    --) shift; break ;;
    -*) echo "Unknown flag: $1" >&2; print_usage; exit 2 ;;
    *)  break ;;
  esac
done

# Positional fallback: email password "display name"
if [[ -z "$EMAIL"        && $# -ge 1 ]]; then EMAIL="$1"; shift; fi
if [[ -z "$PASSWORD"     && $# -ge 1 ]]; then PASSWORD="$1"; shift; fi
if [[ -z "$DISPLAY_NAME" && $# -ge 1 ]]; then DISPLAY_NAME="$1"; shift; fi

if [[ -z "$EMAIL" || -z "$PASSWORD" || -z "$DISPLAY_NAME" ]]; then
  echo "Error: email, password, and display name are required." >&2
  print_usage
  exit 2
fi

if [[ ${#PASSWORD} -lt 8 ]]; then
  echo "Error: password must be at least 8 characters." >&2
  exit 2
fi

# Build JSON safely. Prefer jq for correct escaping; fall back to a python escaper.
build_payload () {
  if command -v jq >/dev/null 2>&1; then
    jq -nc --arg e "$EMAIL" --arg p "$PASSWORD" --arg n "$DISPLAY_NAME" \
      '{email:$e, password:$p, displayName:$n}'
  else
    python3 -c '
import json, sys
print(json.dumps({"email": sys.argv[1], "password": sys.argv[2], "displayName": sys.argv[3]}))
' "$EMAIL" "$PASSWORD" "$DISPLAY_NAME"
  fi
}

PAYLOAD="$(build_payload)"

CURL_ARGS=( -sS -X POST "$API_URL/auth/local/register"
            -H "Content-Type: application/json"
            --data-raw "$PAYLOAD"
            -w "\n%{http_code}" )

if [[ -n "${COOKIE_JAR:-}" ]]; then
  CURL_ARGS+=( -c "$COOKIE_JAR" )
fi

RESPONSE="$(curl "${CURL_ARGS[@]}")"
BODY="${RESPONSE%$'\n'*}"
STATUS="${RESPONSE##*$'\n'}"

if [[ "$STATUS" == "201" ]]; then
  echo "✓ Registered $EMAIL ($DISPLAY_NAME)"
  [[ -n "${COOKIE_JAR:-}" ]] && echo "  Auth cookies saved to $COOKIE_JAR"
  exit 0
fi

echo "✗ Registration failed (HTTP $STATUS)" >&2
echo "$BODY" >&2
exit 1
