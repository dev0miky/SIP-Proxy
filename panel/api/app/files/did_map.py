import os
import re
import shutil
import tempfile

from ..config import settings

_LINE = re.compile(r'\s*\["(?P<did>[^"]+)"\]\s*=\s*"(?P<user>[^"]+)"\s*,?\s*')


def read() -> dict[str, str]:
    out: dict[str, str] = {}
    if not os.path.exists(settings.did_map_path):
        return out
    with open(settings.did_map_path) as f:
        for line in f:
            m = _LINE.match(line)
            if m:
                out[m["did"]] = m["user"]
    return out


def write(mapping: dict[str, str]) -> None:
    if mapping:
        body_lines = "\n".join(f'  ["{d}"] = "{u}",' for d, u in sorted(mapping.items()))
        content = f"return {{\n{body_lines}\n}}\n"
    else:
        content = "return {}\n"
    dir_ = os.path.dirname(settings.did_map_path)
    with tempfile.NamedTemporaryFile("w", dir=dir_, delete=False) as tf:
        tf.write(content)
        tmp = tf.name
    shutil.move(tmp, settings.did_map_path)
