from fastapi import FastAPI
from pathlib import Path
from fastapi.staticfiles import StaticFiles

from fastapi.middleware.cors import CORSMiddleware

from backend.src.core.databaseCore import engine, Base
import backend.src.models # This triggers the __init__.py and loads all classes

from backend.src.routers.videoAnalysisRoute import router as video_analysis_router

# Create tables in DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Multimodal Deception Detection API")

BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_analysis_router)

@app.get("/")
def root():
    return {
        "message": "Multimodal Deception Detection API is running."
    }
