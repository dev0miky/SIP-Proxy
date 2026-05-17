from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from .. import auth
from ..config import settings

router = APIRouter(prefix="/api", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginBody, response: Response):
    if body.username != settings.admin_user or not auth.verify_password(body.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    auth.issue_cookie(response, body.username)
    return {"ok": True, "user": body.username}


@router.post("/logout")
def logout(response: Response):
    auth.clear_cookie(response)
    return {"ok": True}


@router.get("/me")
def me(user: str = Depends(auth.current_admin)):
    return {"user": user}
