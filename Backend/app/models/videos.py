from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class VideoUpload(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.now)