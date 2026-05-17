# sip-proxy

A small SIP proxy / SBC example. Kamailio in front, FreeSWITCH behind, Homer for tracing. Everything runs with `docker compose up`.

## What it does

- Internal SIP clients register to Kamailio with simple demo credentials.
- Kamailio routes calls. Internal extensions get bridged through FreeSWITCH; numeric (PSTN-shaped) numbers get handed to FreeSWITCH's `itsp` gateway.
- FreeSWITCH bridges the audio. Its `itsp` gateway holds the real upstream credentials so internal clients never see them.
- DID-to-user mapping for inbound calls lives in a small Lua table (`kamailio/did_map.lua`).
- Every SIP message from Kamailio and FreeSWITCH is mirrored to Homer over HEP. Open `http://localhost:9080` to see ladder diagrams of every call.

## Run it

```bash
cp .env.example .env
# edit .env if you want a real ITSP trunk
make up
make wait
```

Then point a softphone (Zoiper, Linphone, MicroSIP) at `localhost:5060`. Register as `alice` or `bob`, password `1234`. Dial `9196` for the echo test extension. Open Homer at http://localhost:9080.

## Smoke test

```bash
make smoke
```

Health-checks every container, verifies the schema is seeded, and confirms both FreeSWITCH sofia profiles are running and Homer is responding.

## Layout

```
sip-proxy/
├── docker-compose.yml         orchestration
├── Makefile                   up / down / wait / smoke / logs / clean / nuke
├── .env.example               ITSP_* placeholders
├── kamailio/
│   ├── Dockerfile
│   ├── kamailio.cfg           thin bootstrap, loads modules, hands off to Lua
│   ├── kamailio.lua           routing logic (KEMI)
│   ├── users.lua              auth helper
│   ├── did_map.lua            DID -> internal user
│   └── entrypoint.sh
├── freeswitch/
│   ├── Dockerfile
│   ├── entrypoint.sh          sed-substitutes ITSP_* into itsp.xml at boot
│   ├── conf/...               sofia profiles, dialplan
├── mysql/init/                Kamailio schema + demo users (alice/bob, both pwd 1234)
├── homer/                     postgres init + heplify config
└── test/
    ├── wait.sh                polls each service for readiness
    └── smoke.sh               end-to-end health smoke
```

## Security

This is an example. Demo passwords are `1234`, ITSP credentials live in `.env`. Do not expose port 5060 to the public internet without further hardening:

- Real passwords, not `1234`.
- Rate-limiting and fail2ban in front of Kamailio.
- TLS for SIP, SRTP for media.
- Trim the FreeSWITCH dialplan to a closed set of destinations.

## How the credential hiding works

Internal SIP clients authenticate against Kamailio's `subscriber` table (their creds live only in MariaDB). When they dial out, Kamailio routes the INVITE to FreeSWITCH; FreeSWITCH's `itsp` gateway proxies the call upstream and authenticates with the trunk credentials that live only in `.env`. The upstream provider never sees the internal user's identity, and internal users never see the trunk credentials.

For inbound, the upstream sends a call addressed to the trunk identity; Kamailio whitelists the upstream's IP, looks up the dialed DID in `did_map.lua`, and bridges to the matching internal user via FreeSWITCH.

## Tracing

Both Kamailio and FreeSWITCH ship every SIP message to `heplify-server` over HEP v3. heplify writes to PostgreSQL and Homer renders them in the web UI at http://localhost:9080. Default Homer login: `admin / sipcapture`.

## Stack

| Piece | Purpose |
|---|---|
| Kamailio 5.8 (KEMI Lua) | SIP proxy / SBC |
| FreeSWITCH 1.10 | Media anchor + IVR + outbound gateway |
| MariaDB 11 | Kamailio `subscriber` + `location` tables |
| heplify-server | HEP capture collector |
| PostgreSQL 15 | Homer storage |
| Homer 7 web | Capture UI |

## License

MIT. See `LICENSE`.
