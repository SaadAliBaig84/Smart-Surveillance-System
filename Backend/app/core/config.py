from sqlmodel import create_engine
import os
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).resolve().parents[2]/".env"
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL, echo=True)
