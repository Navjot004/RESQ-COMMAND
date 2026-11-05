from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.mongodb import (
    connect_to_mongodb,
    close_mongodb_connection,
    database,
)
from app.routes.auth import router as auth_router
from app.routes.incidents import router as incidents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()

    await database.users.create_index("email", unique=True)
    await database.incidents.create_index("created_at")

    yield
    await close_mongodb_connection()


app = FastAPI(
    title="RESQ COMMAND API",
    description="Search and Rescue Coordination Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(incidents_router)


@app.get("/")
async def root():
    return {
        "message": "RESQ COMMAND API is running",
        "status": "online",
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
    }