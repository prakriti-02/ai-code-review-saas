from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.home import router as home_router
from app.routes.review import router as review_router
from app.routes.auth import router as auth_router
from app.routes.history import router as history_router


# =========================================================
# CODELENS AI — FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="CodeLens AI",
    description="AI-powered code review SaaS using Gemini AI.",
    version="1.0.0",
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://ai-code-review-frontend-bwq6.onrender.com",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(home_router)
app.include_router(review_router)
app.include_router(auth_router)
app.include_router(history_router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "Server is running successfully!",
        "application": "CodeLens AI",
        "version": "1.0.0",
    }