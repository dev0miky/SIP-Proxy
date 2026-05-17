import hashlib

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from .. import auth
from ..db.kamailio import Subscriber, get_session

router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[Depends(auth.current_admin)])


class UserIn(BaseModel):
    username: str
    domain: str = "kamailio"
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    domain: str


class PwdBody(BaseModel):
    password: str


def _ha1(u: str, d: str, p: str) -> str:
    return hashlib.md5(f"{u}:{d}:{p}".encode()).hexdigest()


@router.get("", response_model=list[UserOut])
def list_users():
    with get_session() as s:
        rows = s.execute(select(Subscriber).order_by(Subscriber.username)).scalars().all()
        return [UserOut(id=r.id, username=r.username, domain=r.domain) for r in rows]


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserIn):
    with get_session() as s:
        existing = s.execute(
            select(Subscriber).where(
                Subscriber.username == body.username, Subscriber.domain == body.domain
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="user exists")
        row = Subscriber(
            username=body.username,
            domain=body.domain,
            password=body.password,
            ha1=_ha1(body.username, body.domain, body.password),
        )
        s.add(row)
        s.commit()
        s.refresh(row)
        return UserOut(id=row.id, username=row.username, domain=row.domain)


@router.post("/{user_id}/password", response_model=UserOut)
def reset_password(user_id: int, body: PwdBody):
    with get_session() as s:
        row = s.get(Subscriber, user_id)
        if not row:
            raise HTTPException(404)
        row.password = body.password
        row.ha1 = _ha1(row.username, row.domain, body.password)
        s.commit()
        return UserOut(id=row.id, username=row.username, domain=row.domain)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int):
    with get_session() as s:
        row = s.get(Subscriber, user_id)
        if not row:
            raise HTTPException(404)
        s.delete(row)
        s.commit()
