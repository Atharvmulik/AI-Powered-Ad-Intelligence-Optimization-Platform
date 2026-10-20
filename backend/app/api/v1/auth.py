
from typing import Annotated
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    AuthenticatedUser,
    LoginRequest,
    LoginResponse,
    MessageResponse,
)
from app.services.auth_service import (
    authenticate_user,
    get_authenticated_user,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer(auto_error=False)

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


async def require_authenticated_user(
    db: DatabaseSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> AuthenticatedUser:
    """Dependency for routes requiring a valid bearer token."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await get_authenticated_user(db, credentials.credentials)


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: DatabaseSession,
) -> LoginResponse:
    """Authenticate an authorized user and issue an access token."""

    return await authenticate_user(
        db=db,
        email=str(request.email),
        password=request.password,
    )


@router.get("/me", response_model=AuthenticatedUser)
async def get_current_user(
    user: Annotated[
        AuthenticatedUser,
        Depends(require_authenticated_user),
    ],
) -> AuthenticatedUser:
    """Return the authenticated user's public account information."""

    return user


@router.post("/logout", response_model=MessageResponse)
async def logout(
    user: Annotated[
        AuthenticatedUser,
        Depends(require_authenticated_user),
    ],
) -> MessageResponse:
    """Confirm logout; the client must discard its bearer token."""

    return MessageResponse(
        message="Logout acknowledged. Discard the access token on the client."
    )
