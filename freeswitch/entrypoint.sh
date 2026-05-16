#!/bin/sh
set -eu

TMPL=/etc/freeswitch/sip_profiles/external/itsp.xml.tmpl
OUT=/etc/freeswitch/sip_profiles/external/itsp.xml

if [ -f "$TMPL" ]; then
  sed -e "s|@@ITSP_USER@@|${ITSP_USER:-}|g" \
      -e "s|@@ITSP_PASS@@|${ITSP_PASS:-}|g" \
      -e "s|@@ITSP_REALM@@|${ITSP_REALM:-}|g" \
      -e "s|@@ITSP_PROXY@@|${ITSP_PROXY:-}|g" \
      "$TMPL" > "$OUT"
fi

exec /docker-entrypoint.sh "$@"
