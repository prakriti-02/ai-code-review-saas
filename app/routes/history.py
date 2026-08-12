from bson import ObjectId
from bson.errors import InvalidId

from fastapi import APIRouter, Header, HTTPException

from app.auth.jwt_handler import decode_access_token
from app.database.collections import reviews_collection


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
# GET REVIEW HISTORY
# =========================================================

@router.get("/history")
def get_history(
    authorization: str = Header(None)
):
    user = get_current_user(
        authorization
    )

    reviews = reviews_collection.find(
        {
            "user_id": user["user_id"]
        }
    ).sort(
        "created_at",
        -1
    )

    history = []

    for item in reviews:

        history.append(
            {
                "id": str(item["_id"]),

                "language": item.get(
                    "language",
                    "python"
                ),

                "code": item.get(
                    "code",
                    ""
                ),

                "review": item.get(
                    "review",
                    ""
                ),

                "score": item.get(
                    "score",
                    ""
                ),

                "created_at": item.get(
                    "created_at"
                )
            }
        )

    return {
        "history": history
    }


# =========================================================
# DELETE REVIEW
# =========================================================

@router.delete("/history/{review_id}")
def delete_review(
    review_id: str,
    authorization: str = Header(None)
):
    user = get_current_user(
        authorization
    )

    # -----------------------------------------------------
    # VALIDATE MONGODB OBJECT ID
    # -----------------------------------------------------

    try:

        object_id = ObjectId(
            review_id
        )

    except (
        InvalidId,
        TypeError
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid review ID."
        )

    # -----------------------------------------------------
    # DELETE ONLY USER'S OWN REVIEW
    # -----------------------------------------------------

    result = reviews_collection.delete_one(
        {
            "_id": object_id,
            "user_id": user["user_id"]
        }
    )

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Review not found."
        )

    return {
        "message": "Review deleted successfully."
    }