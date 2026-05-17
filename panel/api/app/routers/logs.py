from fastapi import APIRouter, Depends, HTTPException, Query

from .. import auth
from ..runtime.docker_ctl import logs as docker_logs

ALLOWED = {
    "kamailio": "sipproxy-kamailio",
    "freeswitch": "sipproxy-freeswitch",
    "mysql": "sipproxy-mysql",
    "postgres": "sipproxy-postgres",
    "heplify": "sipproxy-heplify",
    "homer": "sipproxy-homer",
    "panel-api": "sipproxy-panel-api",
    "panel-web": "sipproxy-panel",
}

router = APIRouter(prefix="/api/logs", tags=["logs"], dependencies=[Depends(auth.current_admin)])


@router.get("/{svc}")
def tail(svc: str, lines: int = Query(200, ge=1, le=2000)):
    if svc not in ALLOWED:
        raise HTTPException(404, "unknown service")
    return {"lines": docker_logs(ALLOWED[svc], lines)}
