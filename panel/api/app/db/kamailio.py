from sqlalchemy import BigInteger, Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from ..config import settings

Base = declarative_base()


class Subscriber(Base):
    __tablename__ = "subscriber"
    id = Column(Integer, primary_key=True)
    username = Column(String(64), nullable=False, default="")
    domain = Column(String(64), nullable=False, default="")
    password = Column(String(64), nullable=False, default="")
    ha1 = Column(String(128), nullable=False, default="")
    ha1b = Column(String(128), nullable=False, default="")


class Location(Base):
    __tablename__ = "location"
    id = Column(BigInteger, primary_key=True)
    ruid = Column(String(64), nullable=False, default="")
    username = Column(String(64), nullable=False, default="")
    domain = Column(String(64))
    contact = Column(String(512), nullable=False, default="")
    received = Column(String(128))
    expires = Column(DateTime, nullable=False)
    q = Column(Float, nullable=False, default=1.0)
    user_agent = Column(String(255), nullable=False, default="")


_engine = None
_SessionLocal = None


def get_session():
    global _engine, _SessionLocal
    if _engine is None:
        _engine = create_engine(settings.kamailio_db_url, pool_pre_ping=True)
        _SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)
    return _SessionLocal()
