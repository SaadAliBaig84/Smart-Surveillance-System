from fastapi import UploadFile, File, HTTPException, APIRouter, Depends
import os
from datetime import datetime
from Backend.app.models.videos import VideoUpload
from Backend.app.models.user import User
from Backend.app.api.endpoints.auth import get_current_user
from sqlmodel import Session, select
from Backend.app.core.config import engine
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()
@router.post("/upload_video", summary="Upload Video File", tags=["Video Upload"])
async def upload_video(currentUser:User = Depends(get_current_user), file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .mp4, .avi, .mov, and .mkv files are allowed.")
    
    #Generate a unique filename
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        video_entry = VideoUpload(user_id=currentUser.id, file_path=file_path)
        with Session(engine) as session:
            session.add(video_entry)
            session.commit()
            session.refresh(video_entry)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    return {
        "status": "uploaded",
        "filename": filename,
        "video_id": video_entry.id  # Optional: use for future streaming
    }
