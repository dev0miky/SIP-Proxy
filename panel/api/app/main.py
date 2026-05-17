from fastapi import FastAPI

from .routers import health

app = FastAPI(title="sip-proxy panel api")
app.include_router(health.router)
