from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import cv2
from insightface.app import FaceAnalysis
from Backend.app.api.endpoints.auth import get_current_user
from Backend.app.models.user import User
from sqlmodel import Session, select, join
from Backend.app.core.config import engine
from Backend.app.models.videos import VideoUpload
from Backend.app.models.faces import FaceEmbedding, RegisteredFace
import numpy as np
import os
from ultralytics import YOLO
active_streams={}
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

router = APIRouter()

model = FaceAnalysis(name='buffalo_s')
model.prepare(ctx_id=-1)

model2 = YOLO("C:/Users\Saad Ali Baig/Desktop/SmartSurveillanceSystem/Backend/app/yolov12/weights/fire_smoke_detection.pt")

def load_known_embeddings(user_id:int):
    with Session(engine) as session:
        emb = session.exec(select(FaceEmbedding, RegisteredFace).join(RegisteredFace, RegisteredFace.id==FaceEmbedding.face_id).where(RegisteredFace.user_id==user_id)).all()
        return [(face.name, np.frombuffer(embed.embedding, dtype=np.float32)) for embed,face in emb]

def process_frame(frame, known_embeddings, threshold=0.4):
    faces = model.get(frame)
    
    for face in faces:
        x1,y1,x2,y2 = map(int,face.bbox)
        identity="Unknown"
        score=0.0
        for name, emb in known_embeddings:
            sim = cosine_similarity(face.embedding, emb)
            if sim>threshold and sim>score:
                identity=name
                score=sim
        cv2.rectangle(frame, (x1,y2), (x2,y2), (0,255,0), 2)
        cv2.putText(frame, f"{identity}", (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX,0.5, (0,255,0), 1 )
    
     # ----------- Fire/Smoke Detection ----------- #
    results = model2.predict(source=frame, verbose=False)

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        class_ids = result.boxes.cls.cpu().numpy()
        for (x1, y1, x2, y2), conf, cls_id in zip(boxes, confidences, class_ids):
            label = result.names[1-int(cls_id)]
            color = (0, 0, 255)  # Red for fire/smoke
            cv2.rectangle(frame, (int(x1), int(y1)),
                          (int(x2), int(y2)), color, 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (int(x1), int(y1) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    return frame

def mjpeg_streamer(video_path, known_embeddings, user_id):
    cap = cv2.VideoCapture(video_path)
    while True:
        if not active_streams.get(user_id, False):
            print(f"User {user_id} stopped the stream.")
            break

        success, frame = cap.read()
        if not success:
            break

        processed = process_frame(frame=frame, known_embeddings=known_embeddings)
        ret, jpeg = cv2.imencode(".jpg",processed)
        if not ret:
            continue

        frame_bytes = jpeg.tobytes()

        yield(
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"+frame_bytes+b"\r\n"
        )
    cap.release()
    cv2.destroyAllWindows()

@router.get("/stream_video/{video_id}", response_class=StreamingResponse)
def stream_video(video_id: int,current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        video = session.exec(select(VideoUpload).where(VideoUpload.id==video_id)).first()

    if not video or video.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied.")   

    path = video.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found.")

    known_emb = load_known_embeddings(current_user.id)

    # Mark stream as active
    active_streams[current_user.id] = True

    return StreamingResponse(
        mjpeg_streamer(path, known_embeddings=known_emb, user_id=current_user.id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.post("/stop_stream", summary="Stop video stream", tags=["Video"])
def stop_stream(current_user: User = Depends(get_current_user)):
    active_streams[current_user.id]=False
    return {"status": "stopped", "message": "Stream stopped successfully"}