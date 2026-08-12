from app.database.connection import db


# =========================================================
# MONGODB COLLECTIONS
# =========================================================

users_collection = db["users"]

reviews_collection = db["reviews"]