
from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with a unique salt."""

    encoded_password = password.encode("utf-8")

    if len(encoded_password) > 72:
        raise ValueError("Password must not exceed 72 UTF-8 bytes.")

    return bcrypt.hashpw(
        encoded_password,
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError, UnicodeError):
        return False


def get_jwt_secret() -> str:
    """Read and validate the JWT signing secret."""

    secret = os.getenv("AUTH_JWT_SECRET")

    if not secret or len(secret.encode("utf-8")) < 32:
        raise RuntimeError(
            "AUTH_JWT_SECRET must be configured with at least 32 bytes."
        )

    return secret


def create_access_token(
    user_id: int,
    email: str,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    """Create a signed JWT for an authenticated user."""

    if expires_minutes <= 0:
        raise ValueError("Token expiration must be positive.")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expires_minutes)

    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": expires_at,
        "jti": secrets.token_urlsafe(16),
    }

    return jwt.encode(
        payload,
        get_jwt_secret(),
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Verify a JWT signature and expiration, then return its claims."""

    return jwt.decode(
        token,
        get_jwt_secret(),
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "iat", "exp", "jti"]},
    )
