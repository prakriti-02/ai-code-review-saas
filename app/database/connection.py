import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


# Load .env
ENV_FILE = (
    Path(__file__)
    .resolve()
    .parents[2]
    / ".env"
)

load_dotenv(ENV_FILE)


# MongoDB URL
MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise RuntimeError("MONGODB_URL is missing.")


# MongoDB client
client = MongoClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
)


# Test connection
try:
    client.admin.command("ping")
    print("MongoDB connection successful.")

except Exception as e:
    raise RuntimeError(
        f"MongoDB connection failed: {e}"
    )


# Database
db = client["code_review_saas"]