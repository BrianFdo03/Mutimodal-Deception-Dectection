import sys
from pathlib import Path

# 1. Get the directory of the current script (backend/tests)
# 2. Get its parent directory (backend)
# 3. Add that parent to the search path
current_script_path = Path(__file__).resolve()
backend_root = current_script_path.parent.parent
sys.path.append(str(backend_root))

# from ml.video.predict_timeline import predict_video_timeline
from ml.video.predict_timeline import predict_video_timeline

VIDEO_PATH = Path("backend/uploads/test_video.mp4")
print(VIDEO_PATH)
if not VIDEO_PATH.exists():
    raise FileNotFoundError(f"Test video not found: {VIDEO_PATH}")

result = predict_video_timeline(VIDEO_PATH)

print("Video:", result["video_name"])
print("Overall score:", result["overall_score"])
print("Overall risk:", result["overall_risk"])
print("Timeline items:", len(result["timeline"]))
print("First 3 timeline items:")
print(result["timeline"][:3])