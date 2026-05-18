#!/bin/sh
set -eu

ENV_FILE=/etc/freeswitch/.env

read_key() {
  if [ -f "$ENV_FILE" ]; then
    grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
  fi
}

ITSP_USER="$(read_key ITSP_USER)"
ITSP_PASS="$(read_key ITSP_PASS)"
ITSP_REALM="$(read_key ITSP_REALM)"
ITSP_PROXY="$(read_key ITSP_PROXY)"
EXTERNAL_IP="$(read_key EXTERNAL_IP)"
EXTERNAL_IP="${EXTERNAL_IP:-auto}"

render() {
  tmpl="$1"; out="$2"
  if [ -f "$tmpl" ]; then
    sed -e "s|@@ITSP_USER@@|${ITSP_USER}|g" \
        -e "s|@@ITSP_PASS@@|${ITSP_PASS}|g" \
        -e "s|@@ITSP_REALM@@|${ITSP_REALM}|g" \
        -e "s|@@ITSP_PROXY@@|${ITSP_PROXY}|g" \
        -e "s|@@EXTERNAL_IP@@|${EXTERNAL_IP}|g" \
        "$tmpl" > "$out"
  fi
}

render /etc/freeswitch/sip_profiles/external/itsp.xml.tmpl /etc/freeswitch/sip_profiles/external/itsp.xml
render /etc/freeswitch/vars.xml.tmpl /etc/freeswitch/vars.xml

exec /docker-entrypoint.sh "$@"
