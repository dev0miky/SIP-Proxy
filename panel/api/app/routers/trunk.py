from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import auth
from ..config import settings
from ..files import trunk_env
from ..runtime.docker_ctl import restart

router = APIRouter(prefix="/api/trunk", tags=["trunk"], dependencies=[Depends(auth.current_admin)])


class TrunkBody(BaseModel):
    ITSP_USER: str = ""
    ITSP_PASS: str = ""
    ITSP_REALM: str = ""
    ITSP_PROXY: str = ""


@router.get("", response_model=TrunkBody)
def read_trunk():
    return TrunkBody(**trunk_env.read())


@router.put("")
def write_trunk(body: TrunkBody):
    prev = trunk_env.read()
    trunk_env.write(body.model_dump())
    try:
        restart(settings.media_container, timeout=30)
    except Exception as e:
        trunk_env.write(prev)
        raise HTTPException(status_code=500, detail=f"media container restart failed: {e}")
    return {"ok": True}
