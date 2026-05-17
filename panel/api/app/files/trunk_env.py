import os
import shutil
import tempfile

from ..config import settings

TRUNK_KEYS = ("ITSP_USER", "ITSP_PASS", "ITSP_REALM", "ITSP_PROXY")


def read() -> dict[str, str]:
    out = {k: "" for k in TRUNK_KEYS}
    if not os.path.exists(settings.env_file_path):
        return out
    with open(settings.env_file_path) as f:
        for line in f:
            stripped = line.strip()
            if not stripped or "=" not in stripped or stripped.startswith("#"):
                continue
            k, v = stripped.split("=", 1)
            if k in TRUNK_KEYS:
                out[k] = v
    return out


def write(values: dict[str, str]) -> None:
    keys = {k: values.get(k, "") for k in TRUNK_KEYS if k in values}
    lines: list[str] = []
    seen: set[str] = set()
    if os.path.exists(settings.env_file_path):
        with open(settings.env_file_path) as f:
            for line in f:
                stripped = line.strip()
                if stripped and "=" in stripped and not stripped.startswith("#"):
                    k = stripped.split("=", 1)[0]
                    if k in keys:
                        lines.append(f"{k}={keys[k]}\n")
                        seen.add(k)
                        continue
                lines.append(line if line.endswith("\n") else line + "\n")
    for k, v in keys.items():
        if k not in seen:
            lines.append(f"{k}={v}\n")
    dir_ = os.path.dirname(settings.env_file_path)
    with tempfile.NamedTemporaryFile("w", dir=dir_, delete=False) as tf:
        tf.writelines(lines)
        tmp = tf.name
    shutil.move(tmp, settings.env_file_path)
