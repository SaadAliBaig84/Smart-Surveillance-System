from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select, Field
from Backend.app.core.config import engine
from Backend.app.models.user import User
from Backend.app.core.security import hash_password, verify_password, create_access_token
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).resolve().parents[2]/".env"
load_dotenv(dotenv_path=env_path)
router = APIRouter()

# Pydantic models for user authentication
class SignupInput(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Signup endpoint
@router.post("/signup", summary="User Signup", tags=["Authentication"], status_code=201)
def signup(data: SignupInput):
    with Session(engine) as session:
        #check if user already exists
        existing_user = session.exec(select(User).where(User.email == data.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        #create new user
        new_user = User(
            username = data.username,
            email = data.email,
            password = hash_password(data.password)
        )
        print(new_user)
        #save user to database
        session.add(new_user)
        session.commit()
        #refresh user instance to get the newly created ID
        session.refresh(new_user)
        #create access token
        access_token = create_access_token(data={"sub": str(new_user.id)})

        response = JSONResponse(
            content={
                "message": "User registered successfully",
                "user_id": new_user.id,
                "access_token": TokenResponse(access_token=access_token).model_dump_json()
            },
            status_code=201
        )
        
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="Lax", max_age=3600)

        return response

# Login endpoint
@router.post("/login", summary="User Login", tags=["Authentication"])
def login(data: LoginInput):
    with Session(engine) as session:
        #check if user exists
        user = session.exec(select(User).where(User.email==data.email)).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid email or passoword")
        #verify password
        if not verify_password(data.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        #create access token
        access_token = create_access_token(data={"sub":str(user.id)})
        response = JSONResponse(
            content={
                "message": "User logged in successfully",
                "user_id": user.id,
                "access_token": TokenResponse(access_token=access_token).model_dump_json()
            },
            status_code=200
        )
        
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="Lax", max_age=3600)

        return response
    
def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Token missing from cookies")
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM", "HS256")])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    with Session(engine) as session:
        user = session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user

@router.get("/me", summary="Get Current User", tags=["Authentication"])
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username":current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.post("/logout", summary="User Logout", tags=["Authentication"])
def logout():
    response = JSONResponse(
        content={"message": "User logged out successfully"},
        status_code=200
    )
    response.delete_cookie("access_token")
    return response