# Troubleshooting

## A softphone can't register

```bash
docker compose logs kamailio --tail=50 | grep -iE 'auth|register'
```

Check:

- Is the softphone pointed at `localhost:5060` (or your host's external IP if the phone is off-box)?
- Username / domain: should be `alice@kamailio` (the domain in the `subscriber` table is `kamailio`).
- Password is `1234` for the demo users.
- Many softphones split "Username" and "Login" (a.k.a. Auth Name) into two fields. Both must be set to the SIP username — if Login is empty, the softphone won't send an Authorization header.
- Confirm the user is seeded: `docker compose exec mysql mariadb -ukamailio -pkamailio kamailio -e "SELECT username, ha1 FROM subscriber;"`

## Calls connect but there is no audio

Almost always a NAT or RTP-port problem.

- The host needs UDP ports `10000-10100` reachable from the softphone for RTP.
- If the softphone is on a different machine / over the internet, Asterisk's `external_media_address` must be the host's public IP. Set `EXTERNAL_IP=<public-ip>` in `.env` and restart Asterisk (`docker compose restart asterisk`).
- The pjsip transport entries should not have `local_net` — without it, Asterisk always advertises `external_media_address` in SDP regardless of where the SIP source appears to be.
- Inspect what Asterisk negotiated: `docker compose exec asterisk asterisk -rx 'pjsip show channelstats'` and `'pjsip show transport transport-udp'`.

## Homer shows no calls

```bash
docker compose logs heplify-server --tail=30
docker compose exec postgres psql -U homer -d homer_data -c "\dt" | head
```

- heplify auto-creates the `hep_proto_1_default` table on its first HEP packet. If you haven't placed any traffic yet, the table won't exist.
- Confirm Kamailio's `siptrace` modparam is pointed at `sip:heplify-server:9060`.
- Confirm Asterisk loaded `res_hep` + `res_hep_pjsip`: `docker compose exec asterisk asterisk -rx 'module show like hep'`.

## Upstream rejects outbound calls

The trunk credentials in `.env` are wrong or the pjsip endpoint isn't substituting them correctly.

```bash
docker compose exec asterisk grep -E 'username|password|@@' /etc/asterisk/pjsip.conf
docker compose exec asterisk asterisk -rx 'pjsip show endpoint trunk'
```

The rendered `pjsip.conf` should show your real `ITSP_*` values, not `@@ITSP_USER@@` placeholders. If you see placeholders, the entrypoint sed substitution didn't run — make sure `.env` is mounted into the container at `/etc/asterisk/.env`.

## Kamailio fails to start

The most common reason in this project is a module init error. Look for `ERROR` lines from `<core> [core/sr_module.c]` in:

```bash
docker compose logs kamailio --tail=60
```

Recent gotchas:

- `siputils.so` in 5.8 errors on default `rpid_avp` syntax. This project does not load it for that reason.
- `pv.so` and `kex.so` must be explicitly loaded for `KSR.pv.*` and `KSR.kx.*` to work — without them, `KSR.pv.get("$ru")` errors out and routing falls through to 404.
- `db_mysql` is linked against MariaDB libs and cannot speak MySQL 8's `caching_sha2_password`. That is why the schema container is `mariadb:11` and not `mysql:8`.
- `password_column` must point to the `ha1` column (precomputed hash), not `password` (plaintext). Otherwise every auth fails with valid creds.
- `location` schema version is `9` in Kamailio 5.8. The `version` table must match exactly or usrloc won't initialize.

## I want to test calls without a softphone

Open Zoiper / Linphone / MicroSIP. Two SIP accounts:

| User | Domain | Password |
|---|---|---|
| alice | kamailio | 1234 |
| bob | kamailio | 1234 |

Register both, then dial each other (`alice` dials `bob`), or dial `9196` for the echo extension. Then open http://localhost:9080 (default login `admin / sipcapture`) to see the ladder diagrams.
