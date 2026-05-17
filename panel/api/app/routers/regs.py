from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from .. import auth
from ..db.kamailio import Location, get_session

router = APIRouter(prefix="/api/regs", tags=["regs"], dependencies=[Depends(auth.current_admin)])


class RegOut(BaseModel):
    id: int
    username: str
    contact: str
    received: str | None
    expires: str
    user_agent: str


@router.get("", response_model=list[RegOut])
def list_regs():
    with get_session() as s:
        rows = s.execute(select(Location).order_by(Location.username)).scalars().all()
        return [
            RegOut(
                id=r.id,
                username=r.username,
                contact=r.contact,
                received=r.received,
                expires=r.expires.isoformat(),
                user_agent=r.user_agent,
            )
            for r in rows
        ]
