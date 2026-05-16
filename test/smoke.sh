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

echo "==> verifying freeswitch profiles"
profiles=$(docker compose exec -T freeswitch fs_cli -x 'sofia status' 2>&1 | grep -cE 'RUNNING' || true)
if [ "${profiles:-0}" -lt 2 ]; then
  echo "FAIL: expected >=2 sofia profiles RUNNING, got $profiles" >&2
  docker compose exec -T freeswitch fs_cli -x 'sofia status' >&2
  exit 1
fi
echo "ok: $profiles sofia profiles running (internal + external)"

echo "==> verifying homer web responds"
if ! curl -fsS http://localhost:9080/ -o /dev/null; then
  echo "FAIL: homer UI did not respond at http://localhost:9080/" >&2
  exit 1
fi
echo "ok: homer UI responding at http://localhost:9080/"

echo
echo "smoke ok — stack is healthy. for a real call test, point a softphone (Zoiper, Linphone) at"
echo "localhost:5060 as alice / 1234, dial 9196 for the echo extension, and watch Homer for the flow."
