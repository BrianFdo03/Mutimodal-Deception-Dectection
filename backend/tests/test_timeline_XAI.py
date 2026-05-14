import sys
import json
from pathlib import Path

# Current file: backend/tests/test_timeline_XAI.py
current_script_path = Path(__file__).resolve()

# backend/
backend_root = current_script_path.parent.parent

# project root/
project_root = backend_root.parent

# Add backend/ to Python path so "ml.video..." works
sys.path.append(str(backend_root))

from ml.video.predict_timeline import predict_video_timeline


VIDEO_PATH = backend_root / "uploads" / "test_video.mp4"

print("Backend root:", backend_root)
print("Video path:", VIDEO_PATH)

if not VIDEO_PATH.exists():
    raise FileNotFoundError(f"Test video not found: {VIDEO_PATH}")


result = predict_video_timeline(VIDEO_PATH)

print("\n==============================")
print("Basic Result")
print("==============================")
print("Video:", result["video_name"])
print("Overall score:", result["overall_score"])
print("Overall risk:", result["overall_risk"])
print("Timeline items:", len(result["timeline"]))


if len(result["timeline"]) == 0:
    raise ValueError("No timeline items were generated.")


print("\n==============================")
print("First Timeline Item")
print("==============================")
first_item = result["timeline"][0]
print(json.dumps(first_item, indent=4))


print("\n==============================")
print("First Explanation")
print("==============================")
first_explanation = first_item.get("explanation")

if first_explanation is None:
    raise ValueError(
        "XAI explanation was not found in the timeline item. "
        "Check whether predict_timeline.py was updated to add explanations."
    )

print(json.dumps(first_explanation, indent=4))


print("\n==============================")
print("Flagged Segment Explanations")
print("==============================")

flagged_segments = [
    segment for segment in result["timeline"]
    if segment["risk"] in ["medium", "high"]
]

if len(flagged_segments) == 0:
    print("No medium/high-risk segments found.")
else:
    for segment in flagged_segments[:5]:
        print(f"\nWindow {segment['window_index']}")
        print(f"Time: {segment['start']}s - {segment['end']}s")
        print(f"Risk: {segment['risk']}")
        print(f"Smoothed score: {segment['smoothed_score']}")

        explanation = segment.get("explanation", {})
        print("Summary:", explanation.get("summary", "No summary"))
        print("Detail:", explanation.get("detail", "No detail"))

        print("Main factors:")
        for factor in explanation.get("main_factors", []):
            print("-", factor)

        print("Region scores:")
        print(json.dumps(explanation.get("region_scores", {}), indent=4))


print("\n==============================")
print("XAI Test Completed Successfully")
print("==============================")