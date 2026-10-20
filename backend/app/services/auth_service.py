
from __future__ import annotations

import jwt
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    decode_access_token,
    verify_password,
)
from app.schemas.auth import AuthenticatedUser, LoginResponse


ACCESS_TOKEN_EXPIRE_MINUTES = 30


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> LoginResponse:
    """Authenticate an active authorized user and return a JWT."""

    normalized_email = email.strip().lower()

    result = await db.execute(
        text(
            """
            SELECT id, email, password_hash, is_active, created_at
            FROM public.authorized_users
            WHERE email = :email
            LIMIT 1
            """
        ),
        {"email": normalized_email},
    )

    row = result.mappings().first()

    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if row is None:
        raise invalid_credentials

    if not row["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive. Contact the administrator.",
        )

    password_hash = row["password_hash"]

    if (
        not isinstance(password_hash, str)
        or password_hash.startswith("TEMP_HASH_")
        or not verify_password(password, password_hash)
    ):
        raise invalid_credentials

    token = create_access_token(
        user_id=row["id"],
        email=row["email"],
    )

    user = AuthenticatedUser(
        id=row["id"],
        email=row["email"],
        is_active=row["is_active"],
        created_at=row["created_at"],
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user,
    )


async def get_authenticated_user(
    db: AsyncSession,
    token: str,
) -> AuthenticatedUser:
    """Validate a JWT and confirm the associated account remains active."""

    try:
        payload = decode_access_token(token)

        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise ValueError("Invalid user ID")

        user_id = int(subject)

        if user_id <= 0:
            raise ValueError("Invalid user ID")

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
        RuntimeError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    result = await db.execute(
        text(
            """
            SELECT id, email, is_active, created_at
            FROM public.authorized_users
            WHERE id = :user_id
            LIMIT 1
            """
        ),
        {"user_id": user_id},
    )

    row = result.mappings().first()

    if row is None or not row["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is unavailable.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        id=row["id"],
        email=row["email"],
        is_active=row["is_active"],
        created_at=row["created_at"],
    )
