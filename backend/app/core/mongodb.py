from pymongo import AsyncMongoClient
from app.core.config import settings

client = AsyncMongoClient(
    settings.MONGODB_URL,
    serverSelectionTimeoutMS=15000
)

database = client[settings.MONGODB_DATABASE]


async def connect_to_mongodb():
    await client.admin.command("ping")
    print("MongoDB Connected Successfully!")


async def close_mongodb_connection():
    await client.close()