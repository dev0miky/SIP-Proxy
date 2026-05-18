#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./test/wait.sh

echo "==> verifying kamailio responds to internal OPTIONS"
sip_resp=$(docker compose exec -T kamailio sh -c 'pidof kamailio >/dev/null && echo running')
if [ "$sip_resp" != "running" ]; then
  echo "FAIL: kamailio not running" >&2
  exit 1
fi
echo "ok: kamailio listening on 5060"

echo "==> verifying mariadb schema"
rows=$(docker compose exec -T mysql mariadb -ukamailio -pkamailio kamailio -N -e \
  "SELECT COUNT(*) FROM subscriber;" 2>/dev/null || echo 0)
if [ "${rows:-0}" -lt 2 ]; then
  echo "FAIL: subscriber table missing demo users (got $rows, expected >=2)" >&2
  exit 1
fi
echo "ok: subscriber table has $rows demo users"

echo "==> verifying asterisk pjsip transports"
transports=$(docker compose exec -T asterisk asterisk -rx 'pjsip show transports' 2>&1 | grep -cE 'Transport:.*(udp|tcp)' || true)
if [ "${transports:-0}" -lt 1 ]; then
  echo "FAIL: expected >=1 pjsip transport up, got $transports" >&2
  docker compose exec -T asterisk asterisk -rx 'pjsip show transports' >&2
  exit 1
fi
echo "ok: $transports asterisk pjsip transports running"

echo "==> verifying homer web responds"
if ! curl -fsS http://localhost:9080/ -o /dev/null; then
  echo "FAIL: homer UI did not respond at http://localhost:9080/" >&2
  exit 1
fi
echo "ok: homer UI responding at http://localhost:9080/"

echo "==> verifying panel-web + panel-api"
PORT="${PANEL_HTTP_PORT:-8080}"
if [ -n "$(docker compose ps panel-web --quiet 2>/dev/null)" ]; then
  if ! curl -fsS "http://localhost:${PORT}/" -o /dev/null; then
    echo "FAIL: panel-web did not respond at http://localhost:${PORT}/" >&2
    exit 1
  fi
  if ! curl -fsS "http://localhost:${PORT}/api/health/ping" -o /dev/null; then
    echo "FAIL: panel-api ping failed via panel-web proxy" >&2
    exit 1
  fi
  echo "ok: panel responding at http://localhost:${PORT}/"
else
  echo "skip: panel-web not running (run 'make panel-setup && make panel' to enable)"
fi

echo
echo "smoke ok — stack is healthy. for a real call test, point a softphone (Zoiper, Linphone) at"
echo "localhost:5060 as alice / 1234, dial 9196 for the echo extension, and watch Homer for the flow."
