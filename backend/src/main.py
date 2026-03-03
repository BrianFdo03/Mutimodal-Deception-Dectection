from fastapi import FastAPI
# from core.databaseCore import engine, Base
from src.core.databaseCore import engine, Base
# import src.routers.meetingRoute as meetings

# Create tables in DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecruitAI Backend")

# app.include_router(meetings.router)