from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import src.models  # This triggers the __init__.py and loads all classes
# from core.databaseCore import engine, Base
# from backend..core.databaseCore import engine, Base
# import src.routers.meetingRoute as meetings

from backend.src.routers.videoAnalysisRoute import router as video_analysis_router

# Create tables in DB
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Multimodal Deception Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_analysis_router)
# app.include_router(meetings.router)

@app.get("/")
def root():
    return {
        "message": "Multimodal Deception Detection API is running."
    }