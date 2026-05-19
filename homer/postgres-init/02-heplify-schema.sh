#!/usr/bin/env bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname homer_data <<-EOSQL
  GRANT ALL ON SCHEMA public TO homer;
  ALTER SCHEMA public OWNER TO homer;
EOSQL

psql -v ON_ERROR_STOP=1 --username homer --dbname homer_data <<-EOSQL
  CREATE TABLE IF NOT EXISTS hep_proto_1_default (
    id BIGSERIAL,
    sid VARCHAR NOT NULL DEFAULT '',
    create_date TIMESTAMP NOT NULL DEFAULT NOW(),
    protocol_header JSONB NOT NULL DEFAULT '{}',
    data_header JSONB NOT NULL DEFAULT '{}',
    raw TEXT NOT NULL DEFAULT '',
    CONSTRAINT hep_proto_1_default_pkey PRIMARY KEY (id, create_date)
  ) PARTITION BY RANGE (create_date);

  CREATE TABLE IF NOT EXISTS hep_proto_1_call (
    id BIGSERIAL,
    sid VARCHAR NOT NULL DEFAULT '',
    create_date TIMESTAMP NOT NULL DEFAULT NOW(),
    protocol_header JSONB NOT NULL DEFAULT '{}',
    data_header JSONB NOT NULL DEFAULT '{}',
    raw TEXT NOT NULL DEFAULT '',
    CONSTRAINT hep_proto_1_call_pkey PRIMARY KEY (id, create_date)
  ) PARTITION BY RANGE (create_date);

  CREATE TABLE IF NOT EXISTS hep_proto_1_registration (
    id BIGSERIAL,
    sid VARCHAR NOT NULL DEFAULT '',
    create_date TIMESTAMP NOT NULL DEFAULT NOW(),
    protocol_header JSONB NOT NULL DEFAULT '{}',
    data_header JSONB NOT NULL DEFAULT '{}',
    raw TEXT NOT NULL DEFAULT '',
    CONSTRAINT hep_proto_1_registration_pkey PRIMARY KEY (id, create_date)
  ) PARTITION BY RANGE (create_date);

  CREATE TABLE IF NOT EXISTS hep_proto_1_rtcp (
    id BIGSERIAL,
    sid VARCHAR NOT NULL DEFAULT '',
    create_date TIMESTAMP NOT NULL DEFAULT NOW(),
    protocol_header JSONB NOT NULL DEFAULT '{}',
    data_header JSONB NOT NULL DEFAULT '{}',
    raw TEXT NOT NULL DEFAULT '',
    CONSTRAINT hep_proto_1_rtcp_pkey PRIMARY KEY (id, create_date)
  ) PARTITION BY RANGE (create_date);
EOSQL
