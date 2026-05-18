#!/bin/sh
set -eu

mkdir -p /var/log/kamailio

exec kamailio -DD -E -m 64 -M 8 2>&1 | tee -a /var/log/kamailio/kamailio.log
