from fastapi import APIRouter, Depends, Query

from .. import auth
from ..db.homer import recent_calls

router = APIRouter(prefix="/api/history", tags=["history"], dependencies=[Depends(auth.current_admin)])


@router.get("")
def list_history(limit: int = Query(50, ge=1, le=500)):
    try:
        rows = recent_calls(limit)
    except Exception:
        return []
    for r in rows:
        r["started_at"] = r["started_at"].isoformat() if r.get("started_at") else None
        r["last_seen"] = r["last_seen"].isoformat() if r.get("last_seen") else None
        r["homer_url"] = f"http://localhost:9080/search/result/data?callid={r['callid']}"
    return rows
