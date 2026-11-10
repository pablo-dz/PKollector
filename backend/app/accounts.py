"""Account registration and login endpoints with password hashing."""

import hashlib
import hmac
import os
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import User

router = APIRouter(prefix='/auth', tags=['auth'])

USERNAME_RE = re.compile(r'^[a-z0-9_]{3,30}$')
GUEST_ID_RE = re.compile(r'^[A-Za-z0-9-]{8,64}$')


def get_db():
    """Yield a database session and close it after the request completes."""
    with SessionLocal() as db:
        yield db


def hash_password(password: str) -> str:
    """Hash a password with a random salt using scrypt.

    Args:
        password: The plaintext password to hash.

    Returns:
        A string containing the hexadecimal salt and digest.
    """
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return salt.hex() + ':' + digest.hex()


def verify_password(password: str, stored: str) -> bool:
    """Compare a plaintext password with a stored scrypt hash.

    Args:
        password: The plaintext password supplied during login.
        stored: The stored salt and digest in ``salt:digest`` format.

    Returns:
        Whether the computed digest matches the stored digest.
    """
    salt_hex, digest_hex = stored.split(':')
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest.hex(), digest_hex)


class RegisterBody(BaseModel):
    """Validated request payload for creating an account."""

    username: str = Field(max_length=60)
    password: str = Field(min_length=6, max_length=128)
    guest_id: str | None = Field(default=None, max_length=64)


class LoginBody(BaseModel):
    """Validated request payload for authenticating an account."""

    username: str = Field(max_length=60)
    password: str = Field(max_length=128)


@router.post('/register')
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """Create an account and optionally attach an existing guest collection.

    Args:
        body: Validated username, password, and optional guest identifier.
        db: Database session provided by FastAPI.

    Returns:
        The new account's user ID and normalized username.

    Raises:
        HTTPException: If the username is invalid or already registered.
    """
    username = body.username.strip().lower()
    if not USERNAME_RE.match(username):
        raise HTTPException(400, 'Username must be 3 to 30 characters and contain only letters, numbers, or underscores')
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(409, 'That username is already taken')
    # Reuse the guest ID so cards saved before registration remain in the account.
    user_id = body.guest_id if body.guest_id and GUEST_ID_RE.match(body.guest_id) else uuid.uuid4().hex
    if db.get(User, user_id):
        user_id = uuid.uuid4().hex
    db.add(User(id=user_id, username=username, password_hash=hash_password(body.password)))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'That username is already taken') from None
    return {'user_id': user_id, 'username': username}


@router.post('/login')
def login(body: LoginBody, db: Session = Depends(get_db)):
    """Authenticate an account using its username and password.

    Args:
        body: Validated login credentials.
        db: Database session provided by FastAPI.

    Returns:
        The authenticated account's user ID and username.

    Raises:
        HTTPException: If the username or password is incorrect.
    """
    username = body.username.strip().lower()
    user = db.scalar(select(User).where(User.username == username))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, 'Incorrect username or password')
    return {'user_id': user.id, 'username': user.username}