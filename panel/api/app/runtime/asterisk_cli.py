from ..config import settings
from .docker_ctl import exec_in


def cli(command: str, timeout: int = 10) -> tuple[int, str]:
    return exec_in(settings.media_container, ["asterisk", "-rx", command], timeout=timeout)


def show_channels() -> list[dict]:
    rc, out = cli("core show channels concise")
    if rc != 0 or not out.strip():
        return []
    rows: list[dict] = []
    for line in out.splitlines():
        parts = line.split("!")
        if len(parts) < 9:
            continue
        rows.append({
            "channel": parts[0],
            "context": parts[1],
            "exten": parts[2],
            "callerid_num": parts[4],
            "callerid_name": parts[5],
            "account": parts[6],
            "state": parts[7],
            "application": parts[8],
            "duration": parts[11] if len(parts) > 11 else "",
            "bridgeid": parts[12] if len(parts) > 12 else "",
        })
    return rows


def hangup(channel: str) -> tuple[int, str]:
    return cli(f"channel request hangup {channel}")
