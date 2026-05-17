# Call flows

## Internal user registers

```
alice ──REGISTER──► Kamailio
                    │  KEMI route:
                    │    auth against MariaDB subscriber table
                    │    on success, save() into location table
                    ◄── 200 OK
                    │
                    ▼  HEP mirror → Homer (REGISTER + 401 + REGISTER+auth + 200)
```

Upstream sees nothing. Alice's password hash lives only in the `subscriber` table.

## Internal → internal call (alice dials bob)

```
alice ──INVITE bob@kamailio──► Kamailio
                                │  authenticate alice
                                │  route_to_fs("bob") → $ru = sip:bob@freeswitch:5080
                                ▼
                              FreeSWITCH (default dialplan)
                                │  bridge sofia/internal/bob@kamailio
                                ▼
                              Kamailio   ─INVITE bob@kamailio─►   bob's contact (from location)
                                                            RTP: alice ↔ FS ↔ bob
```

## Outbound call (alice dials +15551234567)

```
alice ──INVITE +15551234567──► Kamailio
                                │  authenticate alice
                                │  looks_like_pstn? yes
                                │  route_to_fs("+15551234567")
                                ▼
                              FreeSWITCH (default dialplan)
                                │  bridge sofia/gateway/itsp/+15551234567
                                │  itsp gateway holds ITSP_USER/ITSP_PASS from .env
                                ▼
                              upstream ITSP
                                                            RTP: alice ↔ FS ↔ ITSP
```

Alice's softphone never sees the trunk credentials. The 401/407 from upstream and the digest auth happen entirely inside FreeSWITCH's sofia gateway.

## Inbound call (PSTN → DID → bob)

```
ITSP ──INVITE +15559876543──► Kamailio
                               │  source IP matches ITSP_PROXY host?
                               │  route_inbound():
                               │    did_map["15559876543"] → "bob"
                               │    route_to_fs("bob")
                               ▼
                             FreeSWITCH (default dialplan)
                               │  bridge sofia/internal/bob@kamailio
                               ▼
                             Kamailio   ─INVITE bob@kamailio─►   bob's contact
```

Bob sees the call as if from a normal SIP peer; the trunk identity is hidden.

## Tracing

Each call above produces 4–20 SIP messages. All of them appear in Homer at http://localhost:9080 with full ladder diagrams. Filter by Call-ID or From/To header in the search bar to find a specific call.
