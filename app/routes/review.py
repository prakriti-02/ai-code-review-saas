from fastapi import APIRouter, Header, HTTPException

from app.auth.jwt_handler import decode_access_token
from app.models.review import ReviewRequest
from app.services.review_service import review_code_service


router = APIRouter()


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format."
        )

    token = authorization.split(
        " ",
        1
    )[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization token."
        )

    payload = decode_access_token(
        token
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    if "user_id" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload."
        )

    return payload


# =========================================================
# AI CODE REVIEW
# =========================================================

@router.post("/review")
def review_code(
    request: ReviewRequest,
    authorization: str = Header(None)
):
    user = get_current_user(
        authorization
    )

    result = review_code_service(
        request.code,
        request.language,
        user["user_id"]
    )

    return result