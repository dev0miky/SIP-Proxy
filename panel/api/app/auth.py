import time

import bcrypt
import jwt
from fastapi import HTTPException, Request, Response, status

from .config import settings

COOKIE_NAME = "sipproxy_session"


def verify_password(password: str) -> bool:
    if not settings.admin_pass_hash:
        return False
    return bcrypt.checkpw(password.encode(), settings.admin_pass_hash.encode())


def issue_cookie(response: Response, username: str) -> None:
    payload = {
        "sub": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=86400,
        httponly=True,
        samesite="lax",
        secure=not settings.panel_dev,
    )


def clear_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME)


def current_admin(request: Request) -> str:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return payload["sub"]
