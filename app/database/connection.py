import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


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
# MONGODB CONFIGURATION
# =========================================================

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise RuntimeError(
        "MONGODB_URL is missing from .env file."
    )


# =========================================================
# MONGODB CLIENT
# =========================================================

client = MongoClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    tls=True
)



# =========================================================
# DATABASE CONNECTION CHECK
# =========================================================

try:

    client.admin.command("ping")

    print("MongoDB connection successful.")

except Exception as e:

    raise RuntimeError(
        f"MongoDB connection failed: {e}"
    )


# =========================================================
# DATABASE
# =========================================================

db = client["code_review_saas"]