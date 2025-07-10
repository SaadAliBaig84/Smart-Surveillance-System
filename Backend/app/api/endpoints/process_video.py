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
import datetime
from Backend.app.api.endpoints.summary import generate_desc,send_summary
import json
from Backend.app.api.endpoints.summary import user_sockets
from fastapi.concurrency import run_in_threadpool
from Backend.app.core.shared_state import scene_logs
from collections import defaultdict

aggregate_stats = defaultdict(lambda: {
    "total_frames": 0,
    "fire_frames": 0,
    "smoke_frames": 0,
    "face_frames": 0,
    "unknown_frames": 0,
    "known_faces_set": set()
})

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

def process_frame(frame, known_embeddings, threshold=0.4, frame_idx=0, fps=30):
    faces = model.get(frame)
    detected_faces=[]
    for face in faces:
        x1,y1,x2,y2 = map(int,face.bbox)
        identity="unknown"
        score=0.0
        for name, emb in known_embeddings:
            sim = cosine_similarity(face.embedding, emb)
            if sim>threshold and sim>score:
                identity=name
                score=sim
        # if score < threshold:
        #     continue
        detected_faces.append(identity)
        cv2.rectangle(frame, (x1,y2), (x2,y2), (0,255,0), 2)
        cv2.putText(frame, f"{identity}", (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX,2, (0,255,0), 2 )
    
    fire_detected = False
    smoke_detected = False
    results = model2.predict(source=frame, verbose=False)

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        class_ids = result.boxes.cls.cpu().numpy()
        for (x1, y1, x2, y2), conf, cls_id in zip(boxes, confidences, class_ids):
            label = result.names[1-int(cls_id)]
            if (conf<0.5 and label=="fire") or conf<0.3 :
                continue
            if label == "fire":
                fire_detected=True
            else:
                smoke_detected=True
            color = (0, 0, 255) if label=="fire" else (255,0,0)
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (int(x1), int(y1) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 2, color, 2)

    seconds = frame_idx / fps
    timestamp = str(datetime.timedelta(seconds=int(seconds)))

    event = {
        "timestamp": timestamp,
        "faces": detected_faces,
        "fire": fire_detected,
        "smoke": smoke_detected
    }

    return frame, event

def has_scene_changed(prev, curr):
    return(
        set(prev["faces"])!=set(curr["faces"]) or prev["fire"]!=curr["fire"] or prev["smoke"]!=curr["smoke"]
    )

def timestamp_to_seconds(ts_str):
    t = datetime.datetime.strptime(ts_str, "%H:%M:%S")
    return t.hour * 3600 + t.minute * 60 + t.second

def logs_to_description(event, verbose=True):
    ts = event["timestamp"]
    faces = event["faces"]
    known_faces = [face for face in faces if face.lower() != "unknown"]
    unknown_count = sum(1 for face in faces if face.lower() == "unknown")

    total_faces = len(known_faces) + unknown_count
    parts = [f"At {ts},"]

    face_phrases = []

    if known_faces:
        face_phrases.append(", ".join(known_faces))
    if unknown_count > 0:
        face_phrases.append(f"{unknown_count} unknown face{'s' if unknown_count > 1 else ''}")

    if total_faces > 0:
        verb = "were" if total_faces > 1 else "was"
        parts.append(f"{' and '.join(face_phrases)} {verb} detected.")
    else:
        parts.append("no faces were detected.")

    fire = event.get("fire", False)
    smoke = event.get("smoke", False)

    if fire and smoke:
        parts.append("fire and smoke were detected.")
    elif fire:
        parts.append("fire was detected.")
    elif smoke:
        parts.append("smoke was detected.")
    elif verbose:
        parts.append("neither fire nor smoke detected.")

    return " ".join(parts)

async def mjpeg_streamer(video_path, known_embeddings, user_id):
    cap = cv2.VideoCapture(video_path)
    frame_idx=0
    fps = cap.get(cv2.CAP_PROP_FPS)

    last_event=None
    last_fire_time = -100
    last_smoke_time = -100
    persist_secs = 2
    skip_interval=2
    try:
        while True:
            if not active_streams.get(user_id, False):
                print(f"User {user_id} stopped the stream.")
                break

            success, frame = cap.read()
            if not success:
                break
            frame_idx += 1
            if frame_idx % skip_interval != 0:
                
                continue
            processed, event = process_frame(frame=frame, known_embeddings=known_embeddings, frame_idx=frame_idx, fps=fps)

            stats = aggregate_stats[user_id]
            stats["total_frames"] += 1
            if event["fire"]:
                stats["fire_frames"] += 1
            if event["smoke"]:
                stats["smoke_frames"] += 1
            if event["faces"]:
                stats["face_frames"] += 1
                known_faces = [f for f in event["faces"] if f.lower() != "unknown"]
                stats["known_faces_set"].update(known_faces)
                if any(f.lower() == "unknown" for f in event["faces"]):
                    stats["unknown_frames"] += 1

            curr_time = timestamp_to_seconds(event["timestamp"])
            if event["fire"]:
                last_fire_time = curr_time
            if event["smoke"]:
                last_smoke_time = curr_time

            event["fire"] = (curr_time - last_fire_time) <= persist_secs
            event["smoke"] = (curr_time - last_smoke_time) <= persist_secs

            should_log = False
            if last_event == None:
                should_log=True
            elif has_scene_changed(last_event, event):
                should_log=True
            elif ((curr_time - timestamp_to_seconds(last_event["timestamp"]))>=3):
                should_log=True

            if should_log:
                # ✅ this is the only change you needed
                await send_summary(user_id, json.dumps(stats, default=list), type="stats")

                if user_id not in scene_logs:
                    scene_logs[user_id] = []
                scene_logs[user_id].append(logs_to_description(event))
                last_event=event

            frame_idx += 1
            ret, jpeg = cv2.imencode(".jpg",processed)
            if not ret:
                continue

            frame_bytes = jpeg.tobytes()

            yield(
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"+frame_bytes+b"\r\n"
            )
    finally:
        cap.release()
        cv2.destroyAllWindows()
                # ✅ Delete video file
        await generate_desc(user_id=user_id, logs=scene_logs.get(user_id,[]))
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                print(f"✅ Deleted video: {video_path}")
            else:
                print(f"⚠️ Video file not found: {video_path}")
        except Exception as e:
            print(f"❌ Error deleting video: {e}")

@router.get("/stream_video/{video_id}", response_class=StreamingResponse)
async def stream_video(video_id: int,current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        video = session.exec(select(VideoUpload).where(VideoUpload.id==video_id)).first()

    if not video or video.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied.")   

    path = video.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found.")

    known_emb = load_known_embeddings(current_user.id)
    active_streams[current_user.id] = True

    async def run_stream():
        return await run_in_threadpool(
            lambda: mjpeg_streamer(path, known_embeddings=known_emb, user_id=current_user.id)
        )

    return StreamingResponse(await run_stream(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.post("/stop_stream", summary="Stop video stream", tags=["Video"])
async def stop_stream(current_user: User = Depends(get_current_user)):
    print("Stop stream request received")
    active_streams[current_user.id]=False

    ws = user_sockets.get(current_user.id)
    if ws:
        try:
            await ws.close(code=1000, reason="Stream manually stopped")
            print("Closed WebSocket for user", current_user.id)
            
        except Exception as e:
            print("Failed to close WebSocket:", e)
        user_sockets.pop(current_user.id,None)
    return {"status": "stopped", "message": "Stream stopped successfully"}
