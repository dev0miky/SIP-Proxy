import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    admin_user: str = "admin"
    admin_pass_hash: str = ""
    admin_pass_hash_file: str = "/run/secrets/admin_hash"
    jwt_secret: str = ""
    jwt_secret_file: str = "/run/secrets/jwt_secret"
    kamailio_db_url: str = "mysql+pymysql://kamailio:kamailio@mysql/kamailio"
    homer_db_url: str = "postgresql+psycopg://homer:homer@postgres/homer_data"
    media_container: str = "sipproxy-asterisk"
    kamailio_container: str = "sipproxy-kamailio"
    env_file_path: str = "/repo/.env"
    did_map_path: str = "/repo/kamailio/did_map.lua"
    panel_dev: bool = False

    def model_post_init(self, __context) -> None:
        if not self.admin_pass_hash and os.path.exists(self.admin_pass_hash_file):
            self.admin_pass_hash = open(self.admin_pass_hash_file).read().strip()
        if not self.jwt_secret and os.path.exists(self.jwt_secret_file):
            self.jwt_secret = open(self.jwt_secret_file).read().strip()


settings = Settings()
