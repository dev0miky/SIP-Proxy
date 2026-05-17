import json

from ..config import settings
from .docker_ctl import exec_in


def cli(command: str, timeout: int = 10) -> tuple[int, str]:
    return exec_in(settings.fs_container, ["fs_cli", "-x", command], timeout=timeout)


def show_channels() -> list[dict]:
    rc, out = cli("show channels as json")
    if rc != 0 or not out.strip():
        return []
    try:
        data = json.loads(out)
    except ValueError:
        return []
    return data.get("rows", [])


def hangup(uuid: str) -> tuple[int, str]:
    return cli(f"uuid_kill {uuid}")
