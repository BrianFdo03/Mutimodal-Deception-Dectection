from pathlib import Path
import shutil
import uuid

from fastapi import UploadFile

from backend.ml.video.predict_timeline import predict_video_timeline


BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_uploaded_video(file: UploadFile) -> Path:
    """
    Saves uploaded video to backend/uploads/ and returns the saved path.
    """

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in [".mp4", ".mov", ".avi", ".mkv"]:
        raise ValueError("Unsupported video format. Please upload MP4, MOV, AVI, or MKV.")

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    saved_path = UPLOAD_DIR / unique_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return saved_path


def analyze_uploaded_video(file: UploadFile):
    """
    Saves uploaded video, runs video timeline inference, and returns result.
    """

    saved_video_path = save_uploaded_video(file)

    try:
        result = predict_video_timeline(saved_video_path)
        result["uploaded_file_path"] = str(saved_video_path)
        return result

    except Exception as error:
        raise error