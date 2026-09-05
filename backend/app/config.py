from pydantic_settings import BaseSettings 

class Settings(BaseSettings):
    mongo_url: str
    db_name: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    class Config:
        env_file = ".env"

settings = Settings()
