# Security

This repository is an **example / educational** SIP proxy. It ships with demo passwords (`1234`) and is meant to be cloned, run on a developer laptop, and torn down. Do not expose it to the public internet without hardening — see [`docs/deploy.md`](./docs/deploy.md) for the prod path (Caddy + Let's Encrypt + fail2ban + pike rate-limit + bcrypt admin + EXTERNAL_IP).

## Reporting a vulnerability

If you find a real security issue:

1. **Don't open a public issue.** Email me at the address on my GitHub profile, or DM me there.
2. Include enough detail to reproduce: container versions, config, exact request / packet, and what you observed.
3. Expect a reply within a few days. This is a personal project, not a vendor with a 24h SLA.

## What's deliberately weak in this repo

- `mysql/init/02-demo-users.sql` seeds `alice / 1234` and `bob / 1234`. Rotate via the panel before opening 5060 to anything other than localhost.
- The panel-api binds the host Docker socket so it can `restart`, `exec`, and read logs. That's root-equivalent on the host. Documented in `docs/deploy.md` §11. For production use, put `tecnativa/docker-socket-proxy` in front.
- SIP runs over plain UDP/TCP. No TLS (5061), no SRTP. Listed as future work in `docs/design.md`.
