import sys
from pathlib import Path
import json

current_script_path = Path(__file__).resolve()
backend_root = current_script_path.parent.parent
project_root = backend_root.parent

sys.path.append(str(project_root))

from backend.ml.audio.predict_timeline import predict_audio_timeline


VIDEO_PATH = backend_root / "uploads" / "test_video.mp4"

print("Video path:", VIDEO_PATH)

if not VIDEO_PATH.exists():
    raise FileNotFoundError(f"Test video not found: {VIDEO_PATH}")

result = predict_audio_timeline(VIDEO_PATH)

print("Video:", result["video_name"])
print("Overall score:", result["overall_score"])
print("Overall risk:", result["overall_risk"])
print("Risk counts:", result["risk_counts"])
print("Timeline items:", len(result["timeline"]))

print("\nFirst 3 timeline items:")
for item in result["timeline"][:3]:
    print(json.dumps(item, indent=2))