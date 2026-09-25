import logging
from typing import Optional
from supabase import create_client, Client
from backend.config import settings

logger = logging.getLogger("mindmesh.supabase")

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Client if credentials are provided.
    Returns None if SUPABASE_URL or SUPABASE_KEY are not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Successfully connected to Supabase at %s", settings.SUPABASE_URL)
            return _supabase_client
        except Exception as e:
            logger.error("Failed to initialize Supabase client: %s", e)
            return None
    else:
        logger.warning(
            "SUPABASE_URL or SUPABASE_KEY not found in environment. "
            "Backend will operate with fallback high-performance in-memory state engine."
        )
        return None

def is_supabase_connected() -> bool:
    return get_supabase_client() is not None
