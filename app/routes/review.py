from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt_handler import decode_access_token
from app.models.review import ReviewRequest
from app.services.review_service import review_code_service


router = APIRouter()

security = HTTPBearer()


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = decode_access_token(token)

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
    user=Depends(get_current_user)
):

    result = review_code_service(
        request.code,
        request.language,
        user["user_id"]
    )

    return result