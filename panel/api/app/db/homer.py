from sqlalchemy import create_engine, text

from ..config import settings

_engine = None


def engine():
    global _engine
    if _engine is None:
        _engine = create_engine(settings.homer_db_url, pool_pre_ping=True)
    return _engine


def recent_calls(limit: int = 50) -> list[dict]:
    sql = text(
        """
        SELECT
          callid,
          MIN(create_date) AS started_at,
          MAX(create_date) AS last_seen,
          COUNT(*) AS message_count,
          MIN(from_user) AS from_user,
          MIN(to_user)   AS to_user
        FROM hep_proto_1_default
        WHERE create_date > now() - interval '24 hours'
        GROUP BY callid
        ORDER BY started_at DESC
        LIMIT :limit
        """
    )
    with engine().connect() as c:
        rows = c.execute(sql, {"limit": limit}).mappings().all()
    return [dict(r) for r in rows]
