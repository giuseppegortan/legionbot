from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:5433/storm_engine"
    QDRANT_URL: str = "http://127.0.0.1:6333"
    
    class Config:
        env_file = ".env"

settings = Settings()
