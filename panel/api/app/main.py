from fastapi import FastAPI

from .routers import auth, health, regs, users

app = FastAPI(title="sip-proxy panel api")

for r in (health, auth, users, regs):
    app.include_router(r.router)
