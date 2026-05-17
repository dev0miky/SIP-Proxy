from fastapi import FastAPI

from .routers import auth, calls, did, health, history, logs, regs, trunk, users

app = FastAPI(title="sip-proxy panel api")

for r in (health, auth, users, regs, did, trunk, calls, logs, history):
    app.include_router(r.router)
