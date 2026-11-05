from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

from app.core.mongodb import database
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    email = payload.email.lower().strip()

    existing_user = await database.users.find_one({"email": email})

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    user = {
        "name": payload.name.strip(),
        "email": email,
        "password": hash_password(payload.password),
        "role": "TEAM_MEMBER",
    }

    try:
        result = await database.users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    user_id = str(result.inserted_id)

    token = create_access_token({
        "sub": user_id,
        "role": user["role"],
    })

    return {
        "access_token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    email = payload.email.lower().strip()

    user = await database.users.find_one({"email": email})

    if not user or not verify_password(
        payload.password, user["password"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])

    token = create_access_token({
        "sub": user_id,
        "role": user["role"],
    })

    return {
        "access_token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }