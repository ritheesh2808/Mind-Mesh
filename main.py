"""
Mind-Mesh Application Entrypoint
Supports running from repository root via:
    uvicorn main:app --host 0.0.0.0 --port $PORT
as well as:
    uvicorn backend.main:app --host 0.0.0.0 --port $PORT
"""

import sys
from pathlib import Path

# Ensure root directory is on sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    from backend.config import settings
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
