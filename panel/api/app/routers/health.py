from fastapi import APIRouter, Depends

from .. import auth
from ..runtime.docker_ctl import ps

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/ping")
def ping():
    return {"ok": True}


@router.get("", dependencies=[Depends(auth.current_admin)])
def overall():
    return ps()
