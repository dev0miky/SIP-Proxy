# sip-proxy — design

**Date:** 2026-05-17
**Status:** Approved, ready for implementation plan
**Scope:** v1 of a public GitHub example showing a small SIP proxy / SBC with full traffic tracing.

---

## 1. Problem

People who learn SIP for the first time hit two walls:

1. They can't tell what a "SIP proxy" is vs. a "media server" vs. an "SBC". Most examples online conflate them.
2. They want to put a real device behind a real SIP trunk without leaking the trunk credentials, and they want to see every packet to debug it.

This project is a runnable example that answers both. One `docker compose up` and you have a working proxy, a media server, a trunk gateway, and a web UI that draws ladder diagrams of every call.

## 2. Goals

- A reader can clone the repo, fill in `.env`, run `docker compose up`, and within 60 seconds:
  - Register a softphone to the proxy.
  - Place an outbound call through an upstream ITSP.
  - Open Homer at `http://localhost:9080` and see the full SIP exchange.
- The repo demonstrates **credential hiding in both directions**: internal users never see trunk credentials, the trunk never sees per-user identities.
- The routing logic is readable to anyone who knows Lua, even if they don't know Kamailio's native cfg language.
- The repo feels human-written. No code comments. No AI tone in docs.

## 3. Non-goals

- Not a production SBC. No rate limiting, fail2ban, TLS, SRTP, or HA in v1.
- Not a load test. No sipp scenarios.
- Not a tutorial on SIP itself. The README assumes the reader knows the basics.
- Not multi-tenant. One trunk, one set of demo users.

## 4. Architecture

```
                                  ┌─────────────────────┐
   Internal softphone             │       Kamailio       │     Upstream ITSP
   (Zoiper / Linphone /  ───────► │  - registrar         │ ──► (Twilio / Telnyx /
    baresip in container)         │  - auth (downstream) │      sip.us / ...)
   creds: alice / 1234            │  - uac auth upstream │
                                  │  - KEMI Lua routing  │
                                  │  - siptrace → HEP    │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │     FreeSWITCH      │
                                  │  - bridges RTP      │
                                  │  - IVR / echo test  │
                                  │  - HEP enabled      │
                                  └──────────┬──────────┘
                                             │ HEP (UDP 9060)
                                             ▼
                          ┌────────────────────────────────────┐
                          │ heplify-server → PostgreSQL ←─ Homer Web │
                          └────────────────────────────────────┘
```

### Invariants

- Internal clients never see upstream ITSP credentials. They live only in Kamailio's `uac` config, loaded from `.env`.
- Upstream never sees per-user internal identities. It only sees the trunk's single account.
- Every SIP message (Kamailio in/out + FreeSWITCH in/out) is HEP-mirrored to Homer.
- Everything runs as a single `docker compose up`.

## 5. Components

| Container | Image | Role |
|---|---|---|
| `kamailio` | `ghcr.io/kamailio/kamailio-ci:5.8` | SIP proxy / SBC. Thin `kamailio.cfg` + KEMI Lua routing. |
| `freeswitch` | `signalwire/freeswitch:1.10` | Media server. Internal sofia profile + echo dialplan. |
| `mysql` | `mysql:8` | Kamailio `subscriber` + `location` tables. |
| `heplify-server` | `sipcapture/heplify-server` | HEP collector on UDP 9060. |
| `postgres` | `postgres:15` | Homer storage. |
| `homer-webapp` | `sipcapture/webapp` | Web UI at `http://localhost:9080`. |
| `baresip` (profile `test`) | custom | Headless softphone for smoke tests. |

### Boundaries

- **Kamailio ↔ FreeSWITCH:** Kamailio rewrites the Request-URI to FreeSWITCH's docker address. FreeSWITCH is bound only to the docker network. They trust each other implicitly — no SIP auth between them.
- **Kamailio ↔ upstream ITSP:** Kamailio's `uac_auth` module replies to `401/407` challenges using credentials from `.env`. Internal clients never see the challenge or the credentials.
- **Anything → Homer:** one-way mirror via HEP. Cannot affect call flow.

## 6. Call flows

### 6a. Internal user registers

```
alice ──REGISTER──► Kamailio
                    │  KEMI route("REGISTER"):
                    │    auth against MySQL subscriber table
                    │    save() into location table
                    ◄── 200 OK
                    │
                    ▼ HEP mirror → Homer
```

### 6b. Outbound call (alice → +15551234567)

```
alice ──INVITE +15551234567──► Kamailio
                                │  route("REQINIT") → not local → route("TO_UPSTREAM")
                                │  From rewritten to trunk identity
                                │  $du set to upstream proxy
                                │  forwarded via FreeSWITCH for media anchoring
                                ▼
                              FreeSWITCH ──originate via gateway "itsp"──► Kamailio
                                                                        │
                                                                        ▼
                                                              upstream ITSP
                                                                        │
                                              ◄── 407 ── uac_auth ──INVITE+auth──►
                                                                        │
                                              ◄────────────── 200 OK ─────────────
       ◄────────── 200 OK back to alice ──────────
                                                            RTP: alice ↔ FS ↔ ITSP
```

### 6c. Inbound call (PSTN → DID → bob)

```
ITSP ──INVITE sip:trunkid@kamailio──► Kamailio
                                       │  route("FROM_UPSTREAM"):
                                       │    IP whitelist check
                                       │    DID lookup in did_map.lua
                                       │    lookup("location") for target user
                                       ▼
                                     FreeSWITCH ──INVITE──► bob
```

### 6d. HEP

Every leg above produces HEP packets visible in Homer with full ladder diagrams. This is the main "trace the traffic" deliverable.

## 7. Configuration

The 30-second user experience:

```bash
git clone <repo>
cd sip-proxy
cp .env.example .env
# edit .env
docker compose up -d
# point softphone at localhost:5060, user alice/1234
# open http://localhost:9080 for Homer
```

### Files the user edits

- `.env` only.
  - `ITSP_USER`, `ITSP_PASS`, `ITSP_REALM`, `ITSP_PROXY`
  - Optionally override demo internal-user passwords.

### Files the user reads but rarely edits

- `kamailio/kamailio.lua` — routing logic in Lua.
- `kamailio/did_map.lua` — DID → user table. Example:
  ```lua
  return {
    ["15551234567"] = "alice",
    ["15559876543"] = "bob",
  }
  ```
- `freeswitch/conf/sip_profiles/external/itsp.xml` — `${ITSP_*}` substituted at boot.
- `mysql/init/02-demo-users.sql` — `alice/1234`, `bob/1234`, marked `-- DEMO ONLY`.

### Secret hygiene

- `.gitignore` covers `.env`, `*.pcap`, `*.log`, `data/`, `homer-data/`, and `CLAUDE.md`.
- `.env.example` ships with placeholder values and inline comments.
- README has a "do not expose port 5060 to the internet without further hardening" warning.

## 8. Testing

Three layers, all driven by `make`.

### 8a. Boot check (CI-friendly)

```bash
make up && make wait
```

`make wait` polls until:
- Kamailio answers `OPTIONS sip:kamailio` with `200 OK`.
- FreeSWITCH `fs_cli -x 'status'` returns ok.
- Homer web returns `200` on `/api/v3/health`.

Times out at 60s with a log dump and non-zero exit.

### 8b. Smoke test

A `baresip` container in the `test` profile:

```bash
docker compose --profile test run --rm baresip
```

Registers `alice@kamailio` with password `1234`, dials `9196` (FreeSWITCH echo), plays a 2-second tone, expects to hear it back. Exits 0 on success.

### 8c. Trace check

```bash
curl -s 'http://localhost:9080/api/v3/search/call/data' | jq '.data | length'
```

Expect ≥ 4 messages. Confirms the HEP pipeline is wired up end-to-end.

### Not in scope for v1

- Live outbound calls to a real ITSP — manual test in README.
- Load tests (sipp scenarios).
- TLS / SRTP.

## 9. Repo structure

```
sip-proxy/
├── README.md
├── CLAUDE.md                          (gitignored)
├── LICENSE                            MIT
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.override.example.yml
├── Makefile                           up / down / wait / test / logs / clean
│
├── kamailio/
│   ├── Dockerfile                     base image + app_lua module
│   ├── kamailio.cfg                   thin bootstrap (~50 lines)
│   ├── kamailio.lua                   KEMI entrypoint
│   ├── did_map.lua
│   ├── users.lua                      helpers
│   └── entrypoint.sh                  envsubst + exec kamailio
│
├── freeswitch/
│   ├── Dockerfile
│   ├── conf/
│   │   ├── freeswitch.xml
│   │   ├── vars.xml
│   │   ├── sip_profiles/
│   │   │   ├── internal.xml
│   │   │   └── external/itsp.xml
│   │   ├── dialplan/
│   │   │   ├── public.xml
│   │   │   └── default.xml
│   │   └── autoload_configs/sofia.conf.xml
│   └── scripts/bridge.lua
│
├── mysql/
│   └── init/
│       ├── 01-schema.sql
│       └── 02-demo-users.sql
│
├── homer/
│   ├── postgres-init/
│   │   ├── 01-schema.sql
│   │   └── 02-data.sql
│   └── heplify/heplify-server.toml
│
├── test/
│   ├── baresip/
│   │   ├── Dockerfile
│   │   └── accounts
│   └── smoke.sh
│
└── docs/
    ├── architecture.md
    ├── call-flows.md
    └── troubleshooting.md
```

## 10. Style rules

Repeating the project rules here so the implementation plan inherits them.

- No code comments. Anywhere. Names and structure carry meaning.
- Plain, human language in READMEs and docs. No "Certainly!", "robust", "seamless", "leverage", "utilize".
- Don't add features the user didn't ask for.
- Don't add error handling for cases that can't happen.
- One bundled change per task.

## 11. Open questions / future work

- TLS / SIP over TLS — defer to v2.
- SRTP — defer to v2.
- Multi-trunk support — currently one set of `ITSP_*` vars. v2 could take a YAML/Lua list.
- WebRTC client — defer; would need an extra sip-over-WS profile in Kamailio.
- GitHub Actions CI running `make up && make test` — easy add, leave for follow-up PR.

## 12. Acceptance criteria

The implementation is done when:

1. `cp .env.example .env && docker compose up -d` brings up all services without errors.
2. `make wait` returns success within 60s of `make up`.
3. A real softphone can register as `alice/1234` and place a call to `9196` (echo).
4. With valid `.env` credentials, an outbound call to a real PSTN number connects and audio flows.
5. Homer shows ladder diagrams for every flow above.
6. No file in the repo (outside `docs/` and `README.md`) contains a comment.
7. `CLAUDE.md` is present locally but does not appear in `git ls-files`.
