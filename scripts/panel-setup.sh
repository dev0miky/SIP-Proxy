#!/usr/bin/env bash
set -euo pipefail

MIN_LEN="${PANEL_PASSWORD_MIN_LEN:-12}"

REPO="$(cd "$(dirname "$0")/.."; pwd)"
ENV_FILE="$REPO/.env"
HASH_FILE="$REPO/panel/admin.hash"
SECRET_FILE="$REPO/panel/jwt.secret"

[ -f "$ENV_FILE" ] || cp "$REPO/.env.example" "$ENV_FILE"
mkdir -p "$(dirname "$HASH_FILE")"

read -rp "admin username [admin]: " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"

while :; do
  read -rsp "admin password (min ${MIN_LEN} chars): " PASSWORD
  echo
  if [ -z "$PASSWORD" ]; then
    echo "password required" >&2
    continue
  fi
  if [ "${#PASSWORD}" -lt "$MIN_LEN" ]; then
    echo "too short (${#PASSWORD} < ${MIN_LEN}). pick something longer." >&2
    continue
  fi
  read -rsp "confirm password: " PASSWORD2
  echo
  if [ "$PASSWORD" != "$PASSWORD2" ]; then
    echo "passwords do not match." >&2
    continue
  fi
  break
done

HASH=$(docker run --rm -i python:3.12-slim sh -c "pip install --quiet bcrypt >/dev/null 2>&1 && python -c \"import bcrypt,sys; print(bcrypt.hashpw(sys.stdin.buffer.read().rstrip(b'\\n'), bcrypt.gensalt(rounds=12)).decode())\"" <<<"$PASSWORD")

printf '%s' "$HASH" > "$HASH_FILE"
chmod 600 "$HASH_FILE"
openssl rand -hex 32 > "$SECRET_FILE"
chmod 600 "$SECRET_FILE"

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
sed -i.bak -e '/^ADMIN_PASS_HASH=/d' -e '/^JWT_SECRET=/d' "$ENV_FILE" && rm "$ENV_FILE.bak"

echo "panel admin: $ADMIN_USER (${#PASSWORD}-char password)"
echo "hash written to $HASH_FILE"
echo "secret written to $SECRET_FILE"
echo "recreate panel-api: docker compose up -d --force-recreate panel-api"
