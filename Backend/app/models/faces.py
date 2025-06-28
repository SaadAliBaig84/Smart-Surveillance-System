from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from typing import Optional
from Backend.app.models.user import User
class RegisteredFace(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str  # NEW FIELD: Name or label for the face
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FaceEmbedding(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    face_id: int = Field(foreign_key="registeredface.id")
    embedding: bytes  # np.ndarray.astype(np.float32).tobytes()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
