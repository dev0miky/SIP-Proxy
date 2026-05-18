from fastapi import APIRouter, Depends, HTTPException

from .. import auth
from ..runtime.asterisk_cli import hangup, show_channels

router = APIRouter(prefix="/api/calls", tags=["calls"], dependencies=[Depends(auth.current_admin)])


@router.get("")
def list_calls():
    return show_channels()


@router.delete("/{channel:path}", status_code=204)
def kill(channel: str):
    rc, out = hangup(channel)
    if rc != 0:
        raise HTTPException(status_code=400, detail=out.strip() or "hangup failed")
