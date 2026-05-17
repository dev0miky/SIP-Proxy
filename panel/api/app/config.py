from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    admin_user: str = "admin"
    admin_pass_hash: str = ""
    jwt_secret: str = ""
    kamailio_db_url: str = "mysql+pymysql://kamailio:kamailio@mysql/kamailio"
    homer_db_url: str = "postgresql+psycopg://homer:homer@postgres/homer_data"
    fs_container: str = "sipproxy-freeswitch"
    kamailio_container: str = "sipproxy-kamailio"
    env_file_path: str = "/repo/.env"
    did_map_path: str = "/repo/kamailio/did_map.lua"
    panel_dev: bool = False


settings = Settings()
