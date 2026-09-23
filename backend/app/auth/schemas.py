from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    department: Optional[str] = None
    team: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "employee"
    consent_to_store: bool = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    consent_to_store: Optional[bool] = True

class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime
    consent_to_store: bool
    consent_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
