from app.files import trunk_env


def test_read_defaults_blank():
    out = trunk_env.read()
    assert out == {"ITSP_USER": "", "ITSP_PASS": "", "ITSP_REALM": "", "ITSP_PROXY": ""}


def test_write_creates_keys():
    trunk_env.write({"ITSP_USER": "u", "ITSP_PASS": "p", "ITSP_REALM": "r", "ITSP_PROXY": "x"})
    out = trunk_env.read()
    assert out["ITSP_USER"] == "u"
    assert out["ITSP_PASS"] == "p"


def test_write_preserves_other_keys():
    from app.config import settings
    with open(settings.env_file_path, "w") as f:
        f.write("FOO=bar\nITSP_USER=old\nOTHER=zz\n")
    trunk_env.write({"ITSP_USER": "new", "ITSP_PASS": "p", "ITSP_REALM": "r", "ITSP_PROXY": "x"})
    text = open(settings.env_file_path).read()
    assert "FOO=bar" in text
    assert "OTHER=zz" in text
    assert "ITSP_USER=new" in text
    assert "ITSP_PASS=p" in text


def test_write_does_not_touch_unknown_keys():
    from app.config import settings
    with open(settings.env_file_path, "w") as f:
        f.write("ADMIN_PASS_HASH=secret\n")
    trunk_env.write({"ITSP_USER": "u"})
    text = open(settings.env_file_path).read()
    assert "ADMIN_PASS_HASH=secret" in text
