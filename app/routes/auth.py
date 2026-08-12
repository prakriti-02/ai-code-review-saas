from fastapi import APIRouter

from app.models.user import UserSignup, UserLogin
from app.database.collections import users_collection
from app.auth.hash_password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token


router = APIRouter()


# =========================================================
# SIGNUP
# =========================================================

@router.post("/signup")
def signup(user: UserSignup):

    email = user.email.strip().lower()

    existing_user = users_collection.find_one(
        {"email": email}
    )

    if existing_user:
        return {
            "error": "Email already registered."
        }

    hashed_password = hash_password(user.password)

    new_user = {
        "name": user.name.strip(),
        "email": email,
        "password": hashed_password,
    }

    users_collection.insert_one(new_user)

    return {
        "message": "User registered successfully."
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(user: UserLogin):

    email = user.email.strip().lower()

    existing_user = users_collection.find_one(
        {"email": email}
    )

    if not existing_user:
        return {
            "error": "Invalid email or password."
        }

    password_valid = verify_password(
        user.password,
        existing_user["password"]
    )

    if not password_valid:
        return {
            "error": "Invalid email or password."
        }

    token = create_access_token(
        {
            "user_id": str(existing_user["_id"]),
            "email": existing_user["email"],
        }
    )

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
    }