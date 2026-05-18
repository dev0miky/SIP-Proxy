# Production deploy

This walks you from a fresh Ubuntu 24.04 VPS to a working sip-proxy that users can register against and place calls through over the public internet.

## 1. What you'll need

- A VPS with a public IP. ~2GB RAM, 1 vCPU, 20GB disk is enough. Hetzner CX22, DigitalOcean s-1vcpu-2gb, or similar (~$5/mo).
- A domain (or subdomain) with DNS you control. We'll point `panel.yourdomain.com` at the VPS for the admin UI.
- A SIP trunk account (Twilio Elastic SIP, Telnyx, sip.us, VoIP.ms, etc.).
- ~30 minutes.

## 2. DNS

Point one A record at the VPS:

| Type | Name | Value |
|---|---|---|
| A | `panel.yourdomain.com` | `<VPS-public-IP>` |

That's it. The SIP/RTP traffic goes directly to the VPS IP — no DNS record needed for SIP itself.

## 3. Firewall

On Ubuntu, the simplest is `ufw`:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp       # Caddy HTTP (Let's Encrypt challenges)
ufw allow 443/tcp      # Caddy HTTPS (panel)
ufw allow 5060/udp     # SIP
ufw allow 5060/tcp     # SIP TCP
ufw allow 10000:10100/udp   # RTP
ufw enable
```

What you're **not** opening: 8080 (panel-web direct), 8000 (panel-api), 3306, 5432, 9080 (Homer). Those stay internal — only Caddy is the front door.

## 4. Install Docker + clone

```bash
apt update && apt install -y docker.io docker-compose-v2 git make openssl
git clone https://github.com/dev0miky/sip-proxy
cd sip-proxy
```

## 5. Config

```bash
cp .env.prod.example .env
nano .env
```

Fill in:

| Key | Value | Notes |
|---|---|---|
| `ITSP_USER` / `ITSP_PASS` / `ITSP_REALM` / `ITSP_PROXY` | From your trunk provider | Realm is usually `<provider-domain>`; proxy is `<provider-host>:5060` |
| `EXTERNAL_IP` | Your VPS public IP | Required for RTP NAT handling. Run `curl ifconfig.me` to find it. |
| `PANEL_HOSTNAME` | `panel.yourdomain.com` | Must match the DNS A record |
| `ACME_EMAIL` | Your email | Let's Encrypt uses it for expiry notifications |
| `COMPOSE_PROFILES` | `prod` | Enables Caddy + fail2ban |

## 6. Admin password

```bash
make panel-setup
```

Pick a strong password (12+ chars enforced). The hash lands in `panel/admin.hash` (mode 0600, gitignored), the JWT secret in `panel/jwt.secret`.

## 7. Bring it up

```bash
make prod-up
make wait
```

`make prod-up` is shorthand for `COMPOSE_PROFILES=prod docker compose up -d --build`. It starts the full stack including Caddy and fail2ban.

Caddy will issue a Let's Encrypt cert for `panel.yourdomain.com` on first request (takes 10–30s). Visit `https://panel.yourdomain.com`, log in as `admin` with the password you set.

## 8. Add users + test

In the panel:

1. **Users** → add `user1` with a real password.
2. **Trunk** → confirm your ITSP creds are filled (they came from `.env`).
3. **DID map** → add your DID → `user1`.

In a softphone on your phone / laptop:

| | Value |
|---|---|
| Username | `user1` |
| Domain | `panel.yourdomain.com` (or the VPS IP) |
| Password | what you set |
| Proxy | `<VPS-IP>:5060` |
| Transport | UDP |

Register. In the panel's **Registrations** page you should see the contact appear.

Place a call out: dial a real phone number. In **Active calls** you'll see the channel; on your phone you'll get audio.

Inbound: call your DID from any phone. The DID map routes it to `user1`'s registered softphone.

## 9. Watch what's happening

```bash
make panel-logs                                  # panel-api + panel-web
docker compose logs -f kamailio | grep -iE 'auth|register|invite'
docker compose --profile prod logs -f fail2ban   # bans as they happen
```

The panel's **Health** page also surfaces all this in the browser.

## 10. Updates

```bash
git pull
make prod-up    # rebuilds + restarts only changed services
```

Rotating the admin password: re-run `make panel-setup`, then `docker compose up -d --force-recreate panel-api`.

Rotating ITSP creds via panel: edit in **Trunk** form, click save. Panel restarts Asterisk only (~6s downtime).

## 11. Hardening checklist before opening to real users

| | |
|---|---|
| ✅ | Admin password ≥ 12 chars (enforced by `make panel-setup`) |
| ✅ | SIP user passwords NOT `1234` — set real ones via panel before any softphone has registered |
| ✅ | `EXTERNAL_IP` set to the VPS public IP (otherwise outside calls have no audio) |
| ✅ | Caddy serving panel over HTTPS (auto on `prod` profile) |
| ✅ | fail2ban active (auto on `prod` profile) — bans IPs after 5 auth failures in 10 min for 1h |
| ✅ | Kamailio `pike` module rate-limits — drops bursts above 16 req/2s per IP |
| ⬜ | TLS for SIP itself (port 5061) — not in v1, see "future work" in the design doc |
| ⬜ | SRTP for media — not in v1 |
| ⬜ | Replace the docker socket bind on panel-api with an allowlist proxy — recommended for hostile environments |

## 12. Things that will go wrong

- **Calls connect but no audio.** Almost always `EXTERNAL_IP`. Set it to the VPS public IP, restart Asterisk (`docker compose restart asterisk`).
- **Cert never issues.** Caddy can't reach Let's Encrypt because port 80 isn't open, or DNS isn't pointing yet. `docker compose --profile prod logs caddy`.
- **fail2ban bans you.** Whitelist your own IP in `fail2ban/data/jail.d/kamailio-auth.conf` with `ignoreip = your.ip.here`.
- **Upstream auth fails.** Wrong creds in `.env`, or the provider needs IP-auth + you haven't added the VPS IP to their allowlist.
- **softphone says "registration failed: 403".** Usually a typo in the user/domain. The domain must be `kamailio` (the value in `subscriber.domain`), or whatever you set when adding via the panel.
