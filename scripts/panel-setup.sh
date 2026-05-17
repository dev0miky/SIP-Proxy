#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.."; pwd)/.env"
[ -f "$ENV_FILE" ] || cp "$(dirname "$ENV_FILE")/.env.example" "$ENV_FILE"

read -rp "admin username [admin]: " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"

read -rsp "admin password: " PASSWORD
echo
[ -n "$PASSWORD" ] || { echo "password required" >&2; exit 1; }

HASH=$(docker run --rm python:3.12-slim sh -c "pip install --quiet bcrypt >/dev/null 2>&1 && python -c \"import bcrypt; print(bcrypt.hashpw(b'$PASSWORD', bcrypt.gensalt(rounds=12)).decode())\"")
SECRET=$(openssl rand -hex 32)

upsert() {
  local key="$1" val="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    awk -v k="$key" -v v="$val" 'BEGIN{FS=OFS="="} $1==k{$0=k"="v} {print}' "$ENV_FILE" > "$ENV_FILE.tmp"
    mv "$ENV_FILE.tmp" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

upsert ADMIN_USER "$ADMIN_USER"
upsert ADMIN_PASS_HASH "$HASH"
upsert JWT_SECRET "$SECRET"

echo "panel admin set as: $ADMIN_USER"
