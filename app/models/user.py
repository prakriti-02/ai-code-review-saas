from pydantic import BaseModel, EmailStr, Field


# =========================================================
# USER SIGNUP
# =========================================================

class UserSignup(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


# =========================================================
# USER LOGIN
# =========================================================

class UserLogin(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128
    )