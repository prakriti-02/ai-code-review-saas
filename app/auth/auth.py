from fastapi import APIRouter
from app.models.user import UserSignup
from app.auth.hash_password import hash_password

router = APIRouter()

@router.post("/signup")
def signup(user: UserSignup):
    hashed = hash_password(user.password)

    return {
        "message": "Hash Working",
        "hashed_password": hashed
    }