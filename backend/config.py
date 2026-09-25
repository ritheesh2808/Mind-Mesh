import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Mind-Mesh AI Collaborative Learning Intelligence API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

settings = Settings()
