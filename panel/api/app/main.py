from fastapi import FastAPI

from .routers import auth, did, health, regs, trunk, users

app = FastAPI(title="sip-proxy panel api")

for r in (health, auth, users, regs, did, trunk):
    app.include_router(r.router)
