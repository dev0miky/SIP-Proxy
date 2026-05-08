#!/usr/bin/env bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE homer_config;
  CREATE DATABASE homer_data;
  CREATE USER homer WITH PASSWORD 'homer';
  GRANT ALL PRIVILEGES ON DATABASE homer_config TO homer;
  GRANT ALL PRIVILEGES ON DATABASE homer_data TO homer;
EOSQL
