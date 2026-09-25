from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import os
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mind-Mesh"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server config
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Supabase (Optional for local memory mode)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Phase 8/18 explicit fallback
    USE_MEMORY_FALLBACK: bool = os.getenv("USE_MEMORY_FALLBACK", "true").lower() == "true"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()

