from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import auth
from ..config import settings
from ..files import did_map
from ..runtime.docker_ctl import exec_in

router = APIRouter(prefix="/api/did", tags=["did"], dependencies=[Depends(auth.current_admin)])


class DidIn(BaseModel):
    did: str
    user: str


def _reload_kamailio() -> tuple[bool, str]:
    rc, out = exec_in(settings.kamailio_container, ["kamcmd", "app_lua.reload"])
    return rc == 0, out.strip()


@router.get("")
def list_dids():
    return did_map.read()


@router.put("")
def upsert_did(body: DidIn):
    prev = did_map.read()
    new = {**prev, body.did: body.user}
    did_map.write(new)
    ok, msg = _reload_kamailio()
    if not ok:
        did_map.write(prev)
        raise HTTPException(status_code=422, detail=f"kamailio reload failed: {msg}")
    return {"ok": True, "count": len(new)}


@router.delete("/{did}")
def delete_did(did: str):
    prev = did_map.read()
    if did not in prev:
        raise HTTPException(404)
    new = {k: v for k, v in prev.items() if k != did}
    did_map.write(new)
    ok, msg = _reload_kamailio()
    if not ok:
        did_map.write(prev)
        raise HTTPException(status_code=422, detail=f"kamailio reload failed: {msg}")
    return {"ok": True, "count": len(new)}
