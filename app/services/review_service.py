from datetime import datetime, timezone
import re

from google import genai

from app.config.settings import GEMINI_API_KEY
from app.database.collections import reviews_collection


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# CODE REVIEW SERVICE
# =========================================================

def review_code_service(
    code: str,
    language: str,
    user_id: str
):

    # -----------------------------------------------------
    # BASIC VALIDATION
    # -----------------------------------------------------

    if not code or not code.strip():
        return {
            "error": "Code cannot be empty."
        }

    if not language or not language.strip():
        return {
            "error": "Programming language is required."
        }

    code = code.strip()
    language = language.strip().lower()

    try:

        # -------------------------------------------------
        # GEMINI CODE REVIEW
        # -------------------------------------------------

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
You are an expert software engineer and code reviewer.

Review the following {language} code.

IMPORTANT RULES:
- Keep the review concise and practical.
- Do not unnecessarily repeat the user's code.
- Use Markdown.
- Keep the total review under 500 words.
- For simple code, keep the review especially short.
- Identify only genuine issues.
- Do not invent bugs.
- Consider correctness, code quality, security,
  performance and maintainability.
- Give an AI score between 1 and 10.

Use EXACTLY these sections:

## Overall Rating
Give a rating from 1-10 with one short reason.

## Bugs
List only real bugs.
If there are no bugs, write "None".

## Code Quality
Give 2-4 concise points.

## Improvements
Give 2-4 practical improvements.

## Performance
Give Time Complexity and Space Complexity.
If exact complexity cannot be determined, explain briefly.

## Security
Mention only relevant security issues.
If there are none, write "None".

## Improved Code
Show a concise improved version only when useful.
Do not repeat the original code unnecessarily.

## Final Verdict
Give a 1-2 sentence conclusion.

IMPORTANT:
At the very end of your response, write the score
on a separate line.

Use EXACTLY this format:

AI_SCORE: 8.5

Do not write anything after the AI_SCORE line.

Code:
{code}
"""
        )

        # -------------------------------------------------
        # GET GEMINI RESPONSE
        # -------------------------------------------------

        review = response.text or ""

        if not review.strip():
            return {
                "error": "AI returned an empty review."
            }

        # -------------------------------------------------
        # EXTRACT AI SCORE
        # -------------------------------------------------

        score_match = re.search(
            r"AI_SCORE:\s*(10(?:\.0)?|[1-9](?:\.\d+)?)",
            review,
            re.IGNORECASE
        )

        score = None

        if score_match:
            score = float(
                score_match.group(1)
            )

            score = max(
                1.0,
                min(10.0, score)
            )

        # -------------------------------------------------
        # REMOVE AI_SCORE FROM REVIEW
        # -------------------------------------------------

        review = re.sub(
            r"\n?\s*AI_SCORE:\s*(10(?:\.0)?|[1-9](?:\.\d+)?)\s*$",
            "",
            review,
            flags=re.IGNORECASE
        ).strip()

        # -------------------------------------------------
        # SAVE REVIEW TO MONGODB
        # -------------------------------------------------

        reviews_collection.insert_one(
            {
                "user_id": user_id,
                "language": language,
                "code": code,
                "review": review,
                "score": score,
                "created_at": datetime.now(
                    timezone.utc
                ),
            }
        )

        # -------------------------------------------------
        # RESPONSE TO FRONTEND
        # -------------------------------------------------

        return {
            "review": review,
            "score": score,
        }

    except Exception as e:

        print(
            "REVIEW SERVICE ERROR:",
            repr(e)
        )

        return {
            "error": (
                "Unable to generate code review. "
                "Please try again."
            )
        }