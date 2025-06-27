from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlmodel import Session, select
from core.config import engine
from models.user import User
from core.security import create_access_token
import os
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).resolve().parents[2]/".env"
load_dotenv(dotenv_path=env_path)

router = APIRouter()
oauth = OAuth()

# Configure OAuth for Google
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",}
)

@router.get("/login", summary="Google Login", tags=["Authentication"])
async def google_login(request: Request):
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        raise HTTPException(status_code=500, detail="Google redirect URI not configured")
    
    # Redirect to Google's OAuth 2.0 authorization endpoint
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback", summary="Google Callback", tags=["Authentication"])
async def google_callback(request: Request):
    token  =await oauth.google.authorize_access_token(request)
    
   
    user_info = await oauth.google.userinfo(token=token)

    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to retrieve user information from Google")
    
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in Google user info")
    username= user_info.get("name", email.split("@")[0])

    google_id = user_info.get("sub")
    if not google_id:
        raise HTTPException(status_code=400, detail="Google ID not found in user info")
    
    # Check if user already exists
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email==email)).first()
        if not user:
            user =User(username=username, email=email, password=None, google_id=google_id)  # Password is None for OAuth users
            session.add(user)
            session.commit()
            session.refresh(user)

        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        response = RedirectResponse(url=os.getenv("FRONTEND_REDIRECT_AFTER_LOGIN"))
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="Lax", max_age=3600)
        return response
    