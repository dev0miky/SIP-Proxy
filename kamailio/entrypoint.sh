#!/bin/sh
set -eu

exec kamailio -DD -E -m 64 -M 8
