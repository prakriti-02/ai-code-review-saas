import os
from pathlib import Path

from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

ENV_FILE = (
    Path(__file__)
    .resolve()
    .parents[2]
    / ".env"
)

load_dotenv(ENV_FILE)


# =========================================================
# GEMINI API CONFIGURATION
# =========================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)


# =========================================================
# VALIDATE GEMINI API KEY
# =========================================================

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from .env file."
    )