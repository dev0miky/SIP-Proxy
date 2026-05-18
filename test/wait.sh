#!/usr/bin/env bash
set -euo pipefail

deadline=$(( $(date +%s) + 90 ))

wait_for() {
  local label="$1"; shift
  while (( $(date +%s) < deadline )); do
    if "$@" >/dev/null 2>&1; then
      echo "ok: $label"
      return 0
    fi
    sleep 2
  done
  echo "FAIL: $label" >&2
  docker compose logs --tail=80 >&2
  exit 1
}

wait_for "mysql"      docker compose exec -T mysql mariadb-admin ping -pkamailio
wait_for "postgres"   docker compose exec -T postgres pg_isready -U postgres
wait_for "kamailio"   docker compose exec -T kamailio sh -c 'pidof kamailio'
wait_for "asterisk"   docker compose exec -T asterisk asterisk -rx 'core show settings'
wait_for "homer"      curl -fsS http://localhost:9080/

echo "all services healthy"
