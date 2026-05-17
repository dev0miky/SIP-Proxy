from fastapi import APIRouter, Depends, HTTPException

from .. import auth
from ..runtime.fs_cli import hangup, show_channels

router = APIRouter(prefix="/api/calls", tags=["calls"], dependencies=[Depends(auth.current_admin)])


@router.get("")
def list_calls():
    return show_channels()


@router.delete("/{uuid}", status_code=204)
def kill(uuid: str):
    rc, out = hangup(uuid)
    if rc != 0:
        raise HTTPException(status_code=400, detail=out.strip() or "hangup failed")
