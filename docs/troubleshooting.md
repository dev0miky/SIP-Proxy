# Troubleshooting

## A softphone can't register

```bash
docker compose logs kamailio --tail=50 | grep -iE 'auth|register'
```

Check:

- Is the softphone pointed at `localhost:5060` (or your host's external IP if the phone is off-box)?
- Username / domain: should be `alice@kamailio` (the domain in the `subscriber` table is `kamailio`).
- Password is `1234` for the demo users.
- Confirm the user is seeded: `docker compose exec mysql mariadb -ukamailio -pkamailio kamailio -e "SELECT username, ha1 FROM subscriber;"`

## Calls connect but there is no audio

Almost always a NAT or RTP-port problem.

- The host needs UDP ports `16384-16484` reachable from the softphone for RTP.
- If the softphone is on a different machine behind NAT, FreeSWITCH's `external_rtp_ip` may need to be set to your host's public IP instead of `auto`. Edit `freeswitch/conf/vars.xml` and rebuild.
- Check `docker compose exec freeswitch fs_cli -x 'sofia status profile internal'` to see negotiated codecs and addresses.

## Homer shows no calls

```bash
docker compose logs heplify-server --tail=30
docker compose exec postgres psql -U homer -d homer_data -c "\dt" | head
```

- heplify auto-creates the `hep_proto_1_default` table on its first HEP packet. If you haven't placed any traffic yet, the table won't exist.
- Confirm Kamailio's `siptrace` modparam is pointed at `sip:heplify-server:9060`.
- Confirm FreeSWITCH's sofia global setting `capture-server` is set to `udp:heplify-server:9060;hep=3;capture_id=200`.

## Upstream rejects calls with 403 / 407 loop

The trunk credentials in `.env` are wrong or the gateway isn't substituting them correctly.

```bash
docker compose exec freeswitch cat /etc/freeswitch/sip_profiles/external/itsp.xml
docker compose exec freeswitch fs_cli -x 'sofia status gateway itsp'
```

The rendered `itsp.xml` should show your real `ITSP_*` values, not `@@ITSP_USER@@` placeholders. If you see placeholders, the entrypoint sed substitution didn't run — check `freeswitch/entrypoint.sh` and that the container ENV vars are set in `docker-compose.yml`.

## Kamailio fails to start

The most common reason in this project is a module init error. Look for `ERROR` lines from `<core> [core/sr_module.c]` in:

```bash
docker compose logs kamailio --tail=60
```

Recent gotchas:

- `siputils.so` in 5.8 errors on default `rpid_avp` syntax. This project does not load it for that reason.
- `db_mysql` is linked against MariaDB libs and cannot speak MySQL 8's `caching_sha2_password`. That is why the schema container is `mariadb:11` and not `mysql:8`.

## I want to test calls without a softphone

Open Zoiper / Linphone / MicroSIP. Two SIP accounts:

| User | Domain | Password |
|---|---|---|
| alice | kamailio | 1234 |
| bob | kamailio | 1234 |

Register both, then dial each other (`alice` dials `bob`), or dial `9196` for the echo extension. Then open http://localhost:9080 (default login `admin / sipcapture`) to see the ladder diagrams.
