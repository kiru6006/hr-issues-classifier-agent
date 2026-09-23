from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User, AuditLog
from app.auth.schemas import UserCreate, UserLogin, UserResponse, Token
from app.auth.utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    now = datetime.utcnow()
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        department=user_in.department,
        team=user_in.team,
        consent_to_store=user_in.consent_to_store,
        consent_timestamp=now if user_in.consent_to_store else None,
        created_at=now
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Immutable Audit Log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="user_registered",
        resource_type="user",
        resource_id=user.id,
        changes={"role": user.role, "consent": user.consent_to_store},
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    # Update consent and last login
    now = datetime.utcnow()
    user.last_login = now
    if user_in.consent_to_store:
        user.consent_to_store = True
        user.consent_timestamp = now
    
    # Audit log login
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="user_logged_in",
        resource_type="user",
        resource_id=user.id,
        changes={"last_login": now.isoformat()},
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
