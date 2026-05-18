# sip-proxy panel — design

**Date:** 2026-05-17
**Status:** Approved, ready for implementation plan
**Scope:** v1 web admin panel for the existing sip-proxy stack (single repo, two new containers).

---

## 1. Problem

The current stack works but every change to it requires editing a file: subscribers in SQL, DIDs in `did_map.lua`, ITSP credentials in `.env`. There is no live view of who is registered or what calls are in progress. Homer covers SIP capture inspection but not configuration or operations.

This panel adds a web UI that covers the day-to-day operator tasks: managing SIP users, looking at registrations, editing the DID map, rotating trunk credentials, watching active calls, browsing call history, and checking service health.

## 2. Goals

- One-stop operator UI at `http://localhost:8080` for the stack.
- All four feature bundles:
  1. Users + live registrations.
  2. Routing config (DID map + ITSP credentials).
  3. Live calls + call history (via Homer).
  4. Service health dashboard with restart and log tail.
- Edits to config files trigger the minimal-necessary container reload (Kamailio `kamcmd app_lua.reload` for DID map; FreeSWITCH `docker restart` for ITSP creds).
- Single admin user, bcrypt password in `.env`. JWT cookie session.
- Polling every 5s for live data; auto-paused when the tab is hidden.
- Dark / light theme with a topbar toggle.

## 3. Non-goals (v1)

- No multi-tenant or per-user roles.
- No password change UI (rotate via `make panel-setup`).
- No WebSocket / SSE log streaming — log tail is a manual refresh.
- No outbound-call origination from the UI.
- No editing of FreeSWITCH dialplan or Kamailio Lua routing logic.
- No history of "who changed what" (audit log).
- No metrics / Prometheus.

## 4. Architecture

```
                          ┌─────────────────────────────────────┐
   Browser ────HTTP───►   │       panel-web (nginx)             │
   localhost:8080         │  Serves the built React SPA          │
                          │  Proxies /api/* → panel-api          │
                          └──────────────┬──────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────────────┐
                          │       panel-api (FastAPI)           │
                          │  - Auth (bcrypt admin from .env)    │
                          │  - JWT in HttpOnly cookie           │
                          │  - REST endpoints                   │
                          └──┬──────────┬───────────┬────────┬──┘
                             │          │           │        │
                MariaDB ◄────┘          │           │        │
              (subscriber,              │           │        │
               location)                │           │        │
                                        ▼           ▼        ▼
                              Postgres (Homer)   fs_cli   Docker socket
                              (call history)    (active   (status,
                                                 calls)   restart,
                                                          logs)
```

### Invariants

- Browser talks only to `panel-web` on `localhost:8080`. Never directly to MariaDB / Postgres / Docker.
- `panel-api` is the only container that has the Docker socket bind-mounted. Security boundary.
- `panel-web` is dumb: serve files + reverse-proxy `/api/*`. No business logic.
- All writes go through `panel-api`. Reads use the same path.

## 5. Components

```
panel/
├── api/                        FastAPI backend
│   ├── Dockerfile              python:3.12-slim
│   ├── pyproject.toml          fastapi, uvicorn, pyjwt, bcrypt,
│   │                           sqlalchemy, pymysql, psycopg2-binary,
│   │                           docker, python-multipart
│   ├── app/
│   │   ├── main.py             FastAPI app + router wiring
│   │   ├── auth.py             admin login, JWT cookie, Depends
│   │   ├── config.py           env reading (ADMIN_*, paths)
│   │   ├── db/
│   │   │   ├── kamailio.py     SQLAlchemy: Subscriber, Location
│   │   │   └── homer.py        readonly Homer queries
│   │   ├── files/
│   │   │   ├── did_map.py      parse + rewrite kamailio/did_map.lua
│   │   │   └── trunk_env.py    parse + rewrite .env (ITSP_* keys only)
│   │   ├── runtime/
│   │   │   ├── docker_ctl.py   ps / restart / logs via Docker SDK
│   │   │   └── fs_cli.py       subprocess docker exec fs_cli
│   │   └── routers/
│   │       ├── users.py        /api/users
│   │       ├── regs.py         /api/regs
│   │       ├── did.py          /api/did
│   │       ├── trunk.py        /api/trunk
│   │       ├── calls.py        /api/calls
│   │       ├── history.py      /api/history
│   │       ├── health.py       /api/health
│   │       └── logs.py         /api/logs/<svc>
│   └── tests/                  pytest + testcontainers
│
├── web/                        React frontend
│   ├── Dockerfile              multi-stage: node:20 build → nginx:alpine
│   ├── nginx.conf              SPA fallback + /api proxy
│   ├── package.json            react 19, vite 5, tailwind 4, shadcn
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             router + auth gate + sidebar layout
│       ├── theme.tsx           dark/light context, persisted in localStorage
│       ├── api/                typed fetch wrappers, one file per resource
│       ├── components/         shadcn primitives + shared bits
│       └── pages/
│           ├── Login.tsx
│           ├── Users.tsx
│           ├── Registrations.tsx
│           ├── DidMap.tsx
│           ├── Trunk.tsx
│           ├── Calls.tsx
│           ├── History.tsx
│           └── Health.tsx
│
└── README.md                   dev mode + production deploy
```

### Component boundaries

- `db/kamailio.py` owns SQLAlchemy models for `subscriber` and `location`. Reused by `users.py` and `regs.py`.
- `files/did_map.py` is a pure-Python parser for `did_map.lua` — `read() → dict`, `write(dict)`. No coupling to Kamailio runtime.
- `files/trunk_env.py` only knows the `ITSP_*` keys. Will not touch `ADMIN_*` or anything else in `.env`.
- `runtime/docker_ctl.py` is the only file that imports the `docker` SDK. Exposes `ps()`, `restart(name)`, `logs(name, tail)`.
- `runtime/fs_cli.py` shells out to `docker exec sipproxy-freeswitch fs_cli -x '...'`. One function per command.
- Each router maps URLs to handlers; routers contain no business logic — they delegate to the modules above.

## 6. Layout (Frontend)

Sidebar layout, three nav groups (manage / live / system), main content fills the rest.

```
┌──────────────────────────────────────────────────────────────┐
│  sip-proxy                                       admin ▾  ☼  │
├─────────────┬────────────────────────────────────────────────┤
│ MANAGE      │                                                │
│  Users      │              <Page content>                    │
│  Regs       │                                                │
│  DIDs       │                                                │
│  Trunk      │                                                │
│ LIVE        │                                                │
│  Calls      │                                                │
│  History    │                                                │
│ SYSTEM      │                                                │
│  Health     │                                                │
└─────────────┴────────────────────────────────────────────────┘
```

Theme toggle (☼/☾) sits in the topbar; preference persisted in `localStorage`.

## 7. Data flows

### 7a. Edit a SIP user (no restart needed)

```
Browser ──POST /api/users {alice/4567}──► panel-api
                                            INSERT INTO kamailio.subscriber
                                              (username, domain, password, ha1=MD5(...))
                                          ◄── 201 {id, username}
```
Kamailio queries MariaDB on every REGISTER auth, so a new row is live immediately. Same shape for password reset and delete.

### 7b. Edit DID map (kamailio reload)

```
Browser ──POST /api/did──► panel-api
                            did_map.py.read() → dict
                            dict["15558675309"] = "alice"
                            did_map.py.write(dict)        → kamailio/did_map.lua updated
                            docker_ctl exec sipproxy-kamailio kamcmd app_lua.reload
                          ◄── 200 {ok, reloaded_at}
```
Sub-second hot reload. Requires `ctl.so` loaded in `kamailio.cfg` (added as part of panel work).

### 7c. Edit ITSP credentials (freeswitch restart)

```
Browser ──POST /api/trunk──► panel-api
                              trunk_env.py.write({ITSP_*})  → .env updated, other lines preserved
                              docker_ctl.restart("sipproxy-freeswitch")  → ~6s downtime for FS only
                            ◄── 200 {ok, restarted_at}
```
Kamailio is unaffected; registrations stay alive (they're in MariaDB + Kamailio's in-memory cache).

### 7d. Polling (every 5s while tab is visible)

| Page | Endpoint | Source |
|---|---|---|
| Registrations | `GET /api/regs` | `SELECT FROM kamailio.location` |
| Active calls | `GET /api/calls` | `docker exec freeswitch fs_cli -x 'show channels as json'` |
| Health | `GET /api/health` | `docker_ctl.ps()` |

Polling pauses when `document.visibilityState !== 'visible'`.

### 7e. Hang up an active call

```
Browser ──DELETE /api/calls/{uuid}──► panel-api
                                       fs_cli("uuid_kill " + uuid)
                                     ◄── 204
```

### 7f. Tail logs (manual)

```
Browser ──GET /api/logs/kamailio?lines=200──► panel-api
                                                docker_ctl.logs("sipproxy-kamailio", 200)
                                              ◄── 200 {lines: [...]}
```

## 8. Authentication

- `.env` adds: `ADMIN_USER`, `ADMIN_PASS_HASH` (bcrypt), `JWT_SECRET` (64-char random).
- `make panel-setup`: interactive script — prompts for a password, computes bcrypt hash, writes hash to `.env`. No plaintext stored.
- `POST /api/login {username, password}` → bcrypt-verify → issue JWT (24h) in `HttpOnly; SameSite=Lax; Secure` cookie. (`Secure` is dropped if `PANEL_DEV=1`.)
- All `/api/*` except `/api/login` and `/api/health/ping` require valid JWT cookie via FastAPI `Depends(current_admin)`.
- `POST /api/logout` clears the cookie.

## 9. Deployment

Two new compose services:

```yaml
  panel-api:
    build: ./panel/api
    container_name: sipproxy-panel-api
    networks: [sip]
    depends_on:
      mysql: { condition: service_healthy }
      postgres: { condition: service_healthy }
    environment:
      ADMIN_USER: ${ADMIN_USER:-admin}
      ADMIN_PASS_HASH: ${ADMIN_PASS_HASH:-}
      JWT_SECRET: ${JWT_SECRET:-}
      KAMAILIO_DB_URL: "mysql+pymysql://kamailio:kamailio@mysql/kamailio"
      HOMER_DB_URL:    "postgresql://homer:homer@postgres/homer_data"
      FS_CONTAINER:        "sipproxy-freeswitch"
      KAMAILIO_CONTAINER:  "sipproxy-kamailio"
      ENV_FILE_PATH:       "/repo/.env"
      DID_MAP_PATH:        "/repo/kamailio/did_map.lua"
    volumes:
      - .:/repo
      - /var/run/docker.sock:/var/run/docker.sock

  panel-web:
    build: ./panel/web
    container_name: sipproxy-panel
    depends_on: [panel-api]
    networks: [sip]
    ports:
      - "8080:80"
```

### Make targets

| Target | What it does |
|---|---|
| `make panel-setup` | Prompts for admin password, writes bcrypt hash + JWT secret to `.env`. |
| `make panel` | Builds and starts `panel-api` + `panel-web`. |
| `make panel-down` | Stops just the panel services. |
| `make panel-logs` | Follows both panel containers' logs. |

The existing `make up` brings up the whole stack including the panel.

### Kamailio change required

Add `loadmodule "ctl.so"` to `kamailio/kamailio.cfg` so that `kamcmd` works from the panel-api side. This is a small, safe addition.

## 10. Failure modes

| Failure | Handling |
|---|---|
| `app_lua.reload` fails (Lua syntax error in did_map after write) | Rollback file from in-memory backup, return 422 with Kamailio's error message. Never leave a broken file on disk. |
| Container restart fails (FS won't come back up after .env edit) | Restore previous `.env`, return 500 with last 50 lines of `docker logs sipproxy-freeswitch`. |
| Docker socket unavailable to panel-api | All `runtime/*` endpoints return 503 with "panel-api can't reach docker socket — check the bind mount". |
| Polling 401 | Frontend redirects to `/login`. |
| `kamcmd` not available (ctl.so missing) | Reload endpoint returns 500 with actionable error pointing at `kamailio.cfg`. |

## 11. Testing

- **Backend:** `pytest` against ephemeral MariaDB + Postgres via `testcontainers`. One file per router. Tests assert behaviour, not mock returns (e.g., "POST /api/users persists a row and a fresh REGISTER from that user gets 200").
- **Frontend:** Vitest + Testing Library for component sanity. One Playwright end-to-end smoke covering login → add user → see them in table → delete.
- **Combined smoke:** `test/smoke.sh` adds `curl -fsS http://localhost:8080/` (web) and `curl -fsS http://localhost:8080/api/health/ping` (api via nginx proxy).

## 12. Risks

| Risk | Mitigation |
|---|---|
| Docker socket = root on host | Bind to `127.0.0.1:8080` only; documented in README Security section; v2 replaces with `tecnativa/docker-socket-proxy` for an allowlist. |
| Editing `did_map.lua` corrupts the file | Backup-before-write; reload check; rollback on Lua error. |
| FreeSWITCH restart drops active calls when ITSP creds change | Surfaced in API response and UI confirmation dialog ("X active calls will drop — continue?"). |
| `python:3.12-slim` + Postgres + MySQL libs ≈ 200MB+ | Use slim + only required deps; target <250MB. |
| Bcrypt hash in `.env` survives `make nuke` | Documented; `make panel-setup` rotates. |

## 13. Acceptance criteria

The panel is done when:

1. `make panel-setup` followed by `make up` brings up panel-api + panel-web with no errors.
2. `http://localhost:8080` renders the login page; valid creds redirect to `/users`.
3. Adding a user via the UI lets that user register from a softphone within 2s.
4. Editing the DID map via the UI takes effect within 1s of save (`kamcmd app_lua.reload`).
5. Editing ITSP credentials via the UI restarts FreeSWITCH only; existing internal registrations stay live.
6. Active calls list updates within 5s of a call starting / ending.
7. Theme toggle persists across reloads.
8. `make smoke` passes the two extra HTTP checks (web + api/health/ping).
9. No file in `panel/` contains a code comment (project rule).
10. Commit history reads like a small feature added by a human (a handful of commits, plain commit messages).

## 14. Open questions / future work

- WebSocket log streaming.
- Password change UI.
- Audit log of admin actions.
- Per-user roles (operator vs read-only).
- Replace docker socket with an allowlisting proxy.
- Per-DID outbound caller-ID overrides.
- Metrics / Prometheus exporter.
