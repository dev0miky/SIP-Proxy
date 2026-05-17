# panel

Web admin panel for the sip-proxy stack. React (Vite) + FastAPI, served behind nginx, single admin user.

## Setup

```bash
make panel-setup    # prompts for admin password, writes bcrypt hash + JWT secret to .env
make up             # brings up the whole stack including panel-api + panel-web
```

Open http://localhost:8080 (or whatever you set `PANEL_HTTP_PORT` to). Default username `admin`.

## What it manages

- **Users** — CRUD on SIP subscribers (MariaDB)
- **Registrations** — live view of who's registered (polled every 5s)
- **DID map** — add / edit / remove DID → user mappings; reloads Kamailio via `kamcmd app_lua.reload`
- **Trunk** — edit upstream ITSP credentials in `.env`; restarts FreeSWITCH on save
- **Active calls** — live channel list with hangup
- **Call history** — last 24h pulled from Homer
- **Health** — container status + log tail

## Dev mode

```bash
cd panel/api
pip install -e '.[test]'
uvicorn app.main:app --reload

cd panel/web
npm install
npm run dev
```

Vite dev server proxies `/api/*` to `panel-api`.

## Security

The panel binds the Docker socket so it can `restart`, `exec`, and read container logs. That means `panel-api` has root-equivalent power over the host. Keep it on `localhost` and don't expose it publicly without:

- An auth proxy in front (oauth2-proxy, Caddy with basic auth, etc.).
- A socket allowlist proxy in between (e.g. `tecnativa/docker-socket-proxy`) so it can only do what the panel actually needs.

The login is a single admin with a bcrypt-hashed password in `.env`. Rotate via `make panel-setup`.

## Tests

```bash
cd panel/api
pip install -e '.[test]'
pytest
```

Covers the `did_map.lua` and `.env` file parsers — the bits where a bug would silently corrupt user-edited files.
