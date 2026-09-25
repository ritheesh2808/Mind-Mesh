import logging
from typing import Optional
from supabase import create_client, Client
from backend.config import settings

logger = logging.getLogger("mindmesh.supabase")

_supabase_client: Optional[Client] = None
_connection_tested: bool = False
_connection_valid: bool = False

def is_valid_supabase_config() -> bool:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return False
    if "your-project.supabase.co" in settings.SUPABASE_URL or "your-supabase" in settings.SUPABASE_KEY:
        return False
    return True

def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Client if credentials are provided and valid.
    Returns None if unconfigured, using placeholders, or unreachable.
    """
    global _supabase_client, _connection_tested, _connection_valid
    if _connection_tested:
        return _supabase_client if _connection_valid else None

    if is_valid_supabase_config():
        try:
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
            client = create_client(settings.SUPABASE_URL, key)
            # Verify connectivity with a lightweight ping
            client.table("projects").select("id").limit(1).execute()
            _supabase_client = client
            _connection_valid = True
            _connection_tested = True
            logger.info("Successfully connected and verified Supabase at %s", settings.SUPABASE_URL)
            return _supabase_client
        except Exception as e:
            logger.warning("Failed to connect or query Supabase (%s). Operating in fallback mode.", e)
            _supabase_client = None
            _connection_valid = False
            _connection_tested = True
            return None
    else:
        logger.info(
            "SUPABASE_URL or SUPABASE_KEY not configured or using default placeholders. "
            "Backend will operate with configured state engine."
        )
        _connection_tested = True
        _connection_valid = False
        return None

def is_supabase_connected() -> bool:
    return get_supabase_client() is not None

def get_database_status() -> str:
    """
    Returns one of:
    - 'database_connected'
    - 'memory_fallback_active'
    - 'database_unavailable'
    """
    if is_supabase_connected():
        return "database_connected"
    if settings.USE_MEMORY_FALLBACK:
        return "memory_fallback_active"
    return "database_unavailable"

