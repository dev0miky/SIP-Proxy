# Architecture

```
                                  ┌─────────────────────┐
   Internal softphone             │      Kamailio       │     Upstream ITSP
   (Zoiper / Linphone /  ───────► │  - registrar        │ ──► (Twilio / Telnyx /
    MicroSIP)                     │  - downstream auth  │      sip.us / ...)
   creds: alice / 1234            │  - KEMI Lua routing │
                                  │  - siptrace → HEP   │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │     FreeSWITCH      │
                                  │  - internal profile │
                                  │  - itsp gateway     │
                                  │  - echo extension   │
                                  │  - HEP capture      │
                                  └──────────┬──────────┘
                                             │ HEP (UDP 9060)
                                             ▼
                          ┌───────────────────────────────────────┐
                          │ heplify-server → PostgreSQL ← Homer Web │
                          │   (browse calls, ladder diagrams)       │
                          └───────────────────────────────────────┘
```

## Container map

| Container | Image | Role |
|---|---|---|
| `sipproxy-kamailio` | local build of `ghcr.io/kamailio/kamailio-ci:5.8` | SIP proxy / SBC. Routing in Lua via KEMI. |
| `sipproxy-freeswitch` | local build of `dheaps/freeswitch:latest` | Media + IVR + outbound trunk gateway. |
| `sipproxy-mysql` | `mariadb:11` | Kamailio `subscriber` and `location` tables. |
| `sipproxy-postgres` | `postgres:15` | Homer storage. |
| `sipproxy-heplify` | `sipcapture/heplify-server:latest` | HEP capture collector on UDP 9060. |
| `sipproxy-homer` | `sipcapture/webapp:latest` | Homer web UI on http://localhost:9080. |

## Invariants

- Internal clients never see upstream ITSP credentials. They live only in `.env`, are substituted into FreeSWITCH's `itsp` gateway config at container start, and never appear in any image.
- Upstream never sees per-user internal identities — only the trunk's single account.
- Every SIP message Kamailio sends or receives is mirrored to Homer via the `siptrace` module.
- Every SIP message FreeSWITCH sends or receives is mirrored to Homer via sofia's `capture-server` setting.
- All services run from a single `docker compose up`.

## Why this split?

- Kamailio is the SIP proxy: cheap, fast, holds no media, makes routing decisions per packet. It owns the registrar, authentication of internal users, and the policy for what calls go where.
- FreeSWITCH is the B2BUA/media server: handles RTP, bridges legs, runs the IVR (echo extension), holds the upstream trunk credentials.
- Homer is the inspector — read-only mirror of SIP signaling for debugging.

This split is how real carriers do it. Kamailio for signaling at scale, a media server (FreeSWITCH or Asterisk) behind it for the parts that need RTP or media handling.
