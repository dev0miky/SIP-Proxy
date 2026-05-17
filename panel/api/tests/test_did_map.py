from app.files import did_map


def test_empty_initial():
    assert did_map.read() == {}


def test_roundtrip():
    did_map.write({"15551112222": "alice", "15553334444": "bob"})
    assert did_map.read() == {"15551112222": "alice", "15553334444": "bob"}


def test_empty_write():
    did_map.write({"x": "y"})
    did_map.write({})
    assert did_map.read() == {}


def test_keys_sorted_on_disk():
    did_map.write({"222": "b", "111": "a"})
    from app.config import settings
    body = open(settings.did_map_path).read()
    assert body.index('"111"') < body.index('"222"')
