from fastapi import FastAPI

from .routers import auth, health

app = FastAPI(title="sip-proxy panel api")

for r in (health, auth):
    app.include_router(r.router)
