import importlib
import os

import pytest


@pytest.fixture(autouse=True)
def isolated_paths(tmp_path, monkeypatch):
    env_path = tmp_path / ".env"
    env_path.write_text("FOO=bar\n")
    did_path = tmp_path / "did_map.lua"
    did_path.write_text("return {}\n")

    monkeypatch.setenv("ENV_FILE_PATH", str(env_path))
    monkeypatch.setenv("DID_MAP_PATH", str(did_path))
    monkeypatch.setenv("ADMIN_USER", "admin")
    monkeypatch.setenv("ADMIN_PASS_HASH", "")
    monkeypatch.setenv("JWT_SECRET", "x" * 64)

    import app.config as cfg
    importlib.reload(cfg)
    import app.files.did_map as dm
    importlib.reload(dm)
    import app.files.trunk_env as te
    importlib.reload(te)
    yield
