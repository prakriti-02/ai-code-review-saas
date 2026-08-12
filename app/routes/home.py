from fastapi import APIRouter


router = APIRouter()


# =========================================================
# HOME
# =========================================================

@router.get("/")
def home():
    return {
        "message": "Welcome to AI Code Review SaaS"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@router.get("/health")
def health():
    return {
        "status": "Server is running successfully!"
    }