# Call flows

## Internal user registers

```
alice ──REGISTER──► Kamailio
                    │  KEMI route:
                    │    auth against MariaDB subscriber table (ha1 column)
                    │    on success, save() into location table
                    ◄── 200 OK
                    │
                    ▼  HEP mirror → Homer (REGISTER + 401 + REGISTER+auth + 200)
```

Upstream sees nothing. Alice's password hash lives only in the `subscriber.ha1` column.

## Internal → internal call (alice dials bob)

```
alice ──INVITE bob@kamailio──► Kamailio
                                │  KSR.registrar.lookup("location") → $ru = sip:bob@<bob-ip>:<bob-port>
                                │  record_route + t_relay
                                ▼
                              bob's softphone   ──180 Ringing──►   alice
                                                            RTP: alice ↔ bob (direct, no media anchor)
```

User-to-user calls don't go through Asterisk at all. Kamailio looks up bob's registered contact and forwards the INVITE directly. RTP flows peer-to-peer.

## Outbound call (alice dials +15551234567)

```
alice ──INVITE +15551234567──► Kamailio
                                │  looks_like_pstn? yes (8+ digits)
                                │  route_to_media("+15551234567")
                                │    → $ru = sip:+15551234567@asterisk:5060
                                ▼
                              Asterisk (from-kamailio context)
                                │  _X. extension matches
                                │  Dial(PJSIP/+15551234567@trunk,30,gT)
                                ▼
                              upstream ITSP
                                │  407 Proxy Auth Required
                                ◄── re-INVITE with credentials from .env
                                │  200 OK
                                                            RTP: alice ↔ Asterisk ↔ ITSP
```

Alice's softphone never sees the trunk credentials. The 407 from upstream and the digest auth happen entirely inside Asterisk's `trunk_auth` pjsip auth.

## Inbound call (PSTN → DID → bob)

```
ITSP ──INVITE 15559876543@kamailio──► Kamailio
                                       │  source_is_itsp? (source IP matches ITSP_PROXY host)
                                       │  route_inbound():
                                       │    did_map["15559876543"] → "bob"
                                       │    $rU := "bob"
                                       │    KSR.registrar.lookup("location") → bob's contact
                                       ▼
                                     bob's softphone   ──180 Ringing──►   ITSP
                                                            RTP: ITSP ↔ bob (direct)
```

Bob sees the call as if from a normal SIP peer; the trunk identity is hidden.

## Tracing

Each call above produces 4–20 SIP messages. All of them appear in Homer at http://localhost:9080 with full ladder diagrams. Kamailio mirrors via `siptrace`, Asterisk via `res_hep`. Filter by Call-ID or From/To header in the search bar to find a specific call.
