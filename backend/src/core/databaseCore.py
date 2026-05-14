import os
from pathlib import Path as FilePath  # Rename it to avoid conflict
from fastapi import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. Get the directory where THIS file (databaseCore.py) is located
# path: root/backend/src/core/
CURRENT_FILE_DIR = FilePath(__file__).resolve()

# 2. Go up two levels to find the backend folder
# path: root/backend/
BACKEND_DIR = CURRENT_FILE_DIR.parent.parent.parent

# 3. Point to the .env file
ENV_PATH = BACKEND_DIR / ".env"


# Load environment variables from .env
load_dotenv(dotenv_path=ENV_PATH)

# Get DB URL from environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session in routers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()