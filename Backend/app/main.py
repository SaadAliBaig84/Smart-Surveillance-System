from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from Backend.app.core.config import engine
from Backend.app.models.user import User
from Backend.app.models.faces import RegisteredFace, FaceEmbedding
from Backend.app.models.videos import VideoUpload
from Backend.app.api.endpoints import auth, auth_google, register_face, video_upload, process_video
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pathlib import Path
from dotenv import load_dotenv
import os
env_path = Path(__file__).resolve().parents[2]/".env"
load_dotenv(dotenv_path=env_path)
@asynccontextmanager
async def lifespan(app:FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(lifespan=lifespan)

# Middleware for CORS
app.add_middleware(CORSMiddleware,
                   allow_origins=["http://localhost:5173"],
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY","my_session_secret_key"),
    https_only=False,  # Set to True in production
    same_site="Lax",
    

)
@app.get("/")
def root():
    return {"message":"Smart Surveillance System Running"}

# Include the authentication router
app.include_router(auth.router, prefix="/auth")
app.include_router(auth_google.router, prefix="/auth/google")
app.include_router(register_face.router, prefix="/auth")
app.include_router(video_upload.router, prefix="/auth")
app.include_router(process_video.router, prefix="/auth")

