from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from sqlmodel import Session, select
from Backend.app.core.config import engine
from Backend.app.models.user import User
from Backend.app.models.faces import RegisteredFace, FaceEmbedding
from datetime import datetime
from typing import List
import os
import cv2
import numpy as np
import insightface
from Backend.app.api.endpoints.auth import get_current_user
router = APIRouter()

model = insightface.app.FaceAnalysis(name='buffalo_s')
model.prepare(ctx_id=-1)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/register_face", summary="Register Face", tags=["Face Registration"])
async def register_face(name: str = Form(...),current_user: User = Depends(get_current_user), files: List[UploadFile] = File(...) ):
    user_id = current_user.id
    if len(files)<1 or len(files)>3:
        raise HTTPException(status_code=400, detail="Please upload 1 to 3 images.")
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        created_faces = 0

        for file in files:
            if not file.filename.endswith(('.jpg', '.jpeg', '.png')):
                raise HTTPException(status_code=400, detail="Invalid file type. Only .jpg, .jpeg, and .png files are allowed.")
            
            file_bytes = await file.read()
            np_img = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

            if img is None:
                continue
            
            faces = model.get(img)
            if not faces:
                continue

            #save registered face
            reg_face = RegisteredFace(user_id=user.id, name=name) 
            session.add(reg_face)
            session.commit()
            session.refresh(reg_face)

            for face in faces:
                embedding_np = face.embedding.astype(np.float32)
                embedding_bytes = embedding_np.tobytes()
                #save face embedding
                face_embedding = FaceEmbedding(face_id = reg_face.id, embedding=embedding_bytes)
                session.add(face_embedding)

            created_faces+=1
        
        session.commit()

        if created_faces == 0:
            raise HTTPException(status_code=400, detail="No valid faces found in the uploaded images.")
        
        return{
            "status": "success",
            "message": f"{created_faces} face embeddings registered successfully for user {user.username}"
        }