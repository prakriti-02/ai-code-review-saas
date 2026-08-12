from pydantic import BaseModel, Field


# =========================================================
# CODE REVIEW REQUEST
# =========================================================

class ReviewRequest(BaseModel):

    code: str = Field(
        min_length=1,
        max_length=50000
    )

    language: str = Field(
        min_length=1,
        max_length=30
    )