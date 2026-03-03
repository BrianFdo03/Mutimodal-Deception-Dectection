# import os
# import shutil
# from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
# from sqlalchemy.orm import Session
# from src.core.databaseCore import get_db
# from src.models.meetingModel import Meeting

# router = APIRouter(prefix="/meetings", tags=["Meetings"])

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# @router.post("/upload")
# async def upload_video(
#     candidate_name: str, 
#     file: UploadFile = File(...), 
#     db: Session = Depends(get_db)
# ):
#     # 1. Save file to disk
#     file_path = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     # 2. Save metadata to Postgres
#     new_meeting = Meeting(
#         candidate_name=candidate_name,
#         video_filename=file.filename,
#         status="pending"
#     )
#     db.add(new_meeting)
#     db.commit()
#     db.refresh(new_meeting)

#     return {"id": new_meeting.id, "filename": file.filename}