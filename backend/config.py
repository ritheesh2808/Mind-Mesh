from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union, Any, Optional
import os
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mind-Mesh"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server config (Render binds PORT dynamically)
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    FRONTEND_ORIGIN: Optional[str] = os.getenv("FRONTEND_ORIGIN", None)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        origins: List[str] = []
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    origins = json.loads(v_trimmed)
                except Exception:
                    pass
            if not origins:
                origins = [origin.strip() for origin in v_trimmed.split(",") if origin.strip()]
        elif isinstance(v, list):
            origins = [str(o).strip() for o in v if str(o).strip()]
        else:
            origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8000",
                "http://127.0.0.1:8000"
            ]

        frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip()
        if frontend_origin and frontend_origin not in origins:
            origins.append(frontend_origin)
        return origins
    
    # Supabase (Optional for local memory mode)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Memory mode must be enabled explicitly, including for local development.
    USE_MEMORY_FALLBACK: bool = os.getenv("USE_MEMORY_FALLBACK", "false").lower() == "true"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()

