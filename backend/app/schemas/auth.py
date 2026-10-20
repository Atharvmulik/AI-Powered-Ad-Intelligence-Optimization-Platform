
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
import jwt

class LoginRequest(BaseModel):
    """Credentials submitted by the login form."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthenticatedUser(BaseModel):
    """Public user information. Never expose password hashes."""

    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime | None = None


class LoginResponse(BaseModel):
    """Successful login response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthenticatedUser


class MessageResponse(BaseModel):
    message: str
