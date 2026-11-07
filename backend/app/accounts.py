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
    with SessionLocal() as db:
        yield db


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return salt.hex() + ':' + digest.hex()


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(':')
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest.hex(), digest_hex)


class RegisterBody(BaseModel):
    username: str = Field(max_length=60)
    password: str = Field(min_length=6, max_length=128)
    guest_id: str | None = Field(default=None, max_length=64)


class LoginBody(BaseModel):
    username: str = Field(max_length=60)
    password: str = Field(max_length=128)


@router.post('/register')
def register(body: RegisterBody, db: Session = Depends(get_db)):
    username = body.username.strip().lower()
    if not USERNAME_RE.match(username):
        raise HTTPException(400, 'El usuario debe tener de 3 a 30 caracteres: letras, números o guion bajo')
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(409, 'Ese nombre de usuario ya existe')
    # La cuenta toma el id del invitado, así sus cartas ya marcadas quedan en la cuenta
    user_id = body.guest_id if body.guest_id and GUEST_ID_RE.match(body.guest_id) else uuid.uuid4().hex
    if db.get(User, user_id):
        user_id = uuid.uuid4().hex
    db.add(User(id=user_id, username=username, password_hash=hash_password(body.password)))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Ese nombre de usuario ya existe') from None
    return {'user_id': user_id, 'username': username}


@router.post('/login')
def login(body: LoginBody, db: Session = Depends(get_db)):
    username = body.username.strip().lower()
    user = db.scalar(select(User).where(User.username == username))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, 'Usuario o contraseña incorrectos')
    return {'user_id': user.id, 'username': user.username}