from fastapi import APIRouter, WebSocket, WebSocketDisconnect, WebSocketException, Query, status
from typing import Dict
from jose import jwt
import os
import asyncio
import traceback
import json
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).resolve().parents[2]/".env"
load_dotenv(dotenv_path=env_path)
client=Groq(api_key=os.getenv("GROQ_API_KEY"))




user_sockets: Dict[int, WebSocket] = {}
scene_logs_pointer = 0
started_loops = set()

router = APIRouter()


@router.websocket("/ws/summary")
async def websocket_summary(websocket: WebSocket, token: str = Query(...)):
    payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM", "HS256")])
    user_id = int(payload.get("sub"))
    if not user_id:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    await websocket.accept()
    user_sockets[user_id] = websocket

    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        user_sockets.pop(user_id, None)


async def send_summary(user_id: int, log: str, type:str):
    websocket = user_sockets.get(user_id)
    if websocket:
        try:
            message = {
                "type": type,
                "data": log
            }
            await websocket.send_text(json.dumps(message)) 
        except Exception:
            user_sockets.pop(user_id, None)




async def generate_desc(user_id, logs):
    combined = " ".join(logs)
    prompt = """You are a surveillance analysis assistant for a system that detects:
- Faces (with known names or marked as "unknown")
- Fire or smoke events 
- Timestamps for each event

Summarize the logs clearly, in past tense, grouping related events when possible.
Treat fire/smoke as continuous if they briefly disappear and reappear (assuming persistence unless there's a 10+ second gap).
Do **not** provide the original log entries or use phrases like 'Here is your summary'.
Instead, simply provide a concise and coherent narrative summarizing the events.

Logs:
"""
    prompt = prompt+combined
    print("\n--- Prompt for Chunk ---\n", prompt)

    try:
        completion = client.chat.completions.create(
            model='llama3-8b-8192',
            messages=[{
                "role":"user",
                "content": prompt
            }],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None
        )
        message=""
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token is None:
                continue
            message +=token
            if token.endswith("."):
                await send_summary(user_id=user_id, log=message , type="summary")
                message=""
    except Exception:
        print("Text generation error:")
        traceback.print_exc()


