from pymongo import MongoClient
from app.config import get_settings

settings = get_settings()

try:
    client = MongoClient(settings.mongodb_url)
    db = client[settings.mongo_db_name]
    print(f"✅ Connected to MongoDB Atlas: {settings.mongo_db_name}")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    db = None

# Dependency to get DB
def get_db():
    yield db

def format_mongo_doc(doc: dict) -> dict:
    """Formats a MongoDB document for frontend/schemas (maps _id to string id)."""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

