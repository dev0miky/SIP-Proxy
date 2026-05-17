import docker
from docker.errors import APIError, DockerException, NotFound

_client = None


def client():
    global _client
    if _client is None:
        _client = docker.from_env()
    return _client


def ps() -> list[dict]:
    out = []
    for c in client().containers.list(all=True, filters={"name": "sipproxy-"}):
        attrs = c.attrs
        state = attrs.get("State", {})
        out.append({
            "name": c.name,
            "image": attrs.get("Config", {}).get("Image", ""),
            "status": state.get("Status", ""),
            "health": (state.get("Health") or {}).get("Status"),
            "started_at": state.get("StartedAt", ""),
        })
    return out


def restart(name: str, timeout: int = 30) -> None:
    client().containers.get(name).restart(timeout=timeout)


def logs(name: str, tail: int = 200) -> list[str]:
    raw = client().containers.get(name).logs(tail=tail).decode(errors="replace")
    return raw.splitlines()


def exec_in(name: str, cmd: list[str], timeout: int = 10) -> tuple[int, str]:
    try:
        ec, out = client().containers.get(name).exec_run(cmd, demux=False)
        return int(ec), out.decode(errors="replace")
    except NotFound:
        return 127, f"container {name} not found"
    except (DockerException, APIError) as e:
        return 1, str(e)
