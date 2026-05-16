import sys
from pathlib import Path
import json

current_script_path = Path(__file__).resolve()
backend_root = current_script_path.parent.parent
project_root = backend_root.parent

sys.path.append(str(project_root))

from backend.ml.video.predict_timeline import predict_video_timeline
from backend.ml.audio.predict_timeline import predict_audio_timeline
from backend.ml.fusion.fuse_timelines import fuse_video_audio_timelines


VIDEO_PATH = backend_root / "uploads" / "test_video.mp4"

print("Video path:", VIDEO_PATH)

if not VIDEO_PATH.exists():
    raise FileNotFoundError(f"Test video not found: {VIDEO_PATH}")


print("\nRunning video timeline inference...")
video_result = predict_video_timeline(VIDEO_PATH)

print("Video overall score:", video_result["overall_score"])
print("Video overall risk:", video_result["overall_risk"])
print("Video timeline items:", len(video_result["timeline"]))

if video_result["timeline"]:
    print("Video first timeline keys:")
    print(video_result["timeline"][0].keys())


print("\nRunning audio timeline inference...")
audio_result = predict_audio_timeline(VIDEO_PATH)

print("Audio overall score:", audio_result["overall_score"])
print("Audio overall risk:", audio_result["overall_risk"])
print("Audio timeline items:", len(audio_result["timeline"]))

if audio_result["timeline"]:
    print("Audio first timeline keys:")
    print(audio_result["timeline"][0].keys())


print("\nRunning multimodal fusion...")
fusion_result = fuse_video_audio_timelines(
    video_result=video_result,
    audio_result=audio_result,
    video_weight=0.6,
    audio_weight=0.4
)

print("\nFusion summary")
print("Fusion overall raw score:", fusion_result["overall_score"])
print("Fusion overall display score:", fusion_result.get("overall_display_score"))
print("Fusion overall risk:", fusion_result["overall_risk"])
print("Fusion risk counts:", fusion_result["risk_counts"])
print("Fusion timeline items:", len(fusion_result["timeline"]))
print("Fusion weights config:", fusion_result.get("weights"))
print("Fusion metadata:", fusion_result.get("metadata"))


print("\nChecking fusion timeline fields...")

required_fields = [
    "window_index",
    "start",
    "end",
    "raw_fusion_score",
    "smoothed_fusion_score",
    "display_score",
    "fusion_score",
    "risk",
    "raw_video_score",
    "raw_audio_score",
    "display_video_score",
    "display_audio_score",
    "video_available",
    "audio_available",
    "fusion_mode",
    "used_weights",
    "modality",
    "explanation",
]

missing_field_report = []

for index, item in enumerate(fusion_result["timeline"]):
    missing_fields = [
        field for field in required_fields
        if field not in item
    ]

    if missing_fields:
        missing_field_report.append({
            "timeline_index": index,
            "missing_fields": missing_fields
        })

if missing_field_report:
    print("Missing fields found:")
    print(json.dumps(missing_field_report[:5], indent=2))
else:
    print("All required fusion fields are present.")


print("\nChecking fusion score logic...")

logic_issues = []

for item in fusion_result["timeline"]:
    raw_fusion_score = item.get("raw_fusion_score")
    smoothed_fusion_score = item.get("smoothed_fusion_score")
    display_score = item.get("display_score")
    fusion_score = item.get("fusion_score")

    if raw_fusion_score is None:
        logic_issues.append({
            "window_index": item.get("window_index"),
            "issue": "raw_fusion_score is missing"
        })

    if smoothed_fusion_score is None:
        logic_issues.append({
            "window_index": item.get("window_index"),
            "issue": "smoothed_fusion_score is missing"
        })

    if display_score is None:
        logic_issues.append({
            "window_index": item.get("window_index"),
            "issue": "display_score is missing"
        })

    # Backward-compatible alias should equal raw fusion score.
    if fusion_score is not None and raw_fusion_score is not None:
        if abs(float(fusion_score) - float(raw_fusion_score)) > 1e-6:
            logic_issues.append({
                "window_index": item.get("window_index"),
                "issue": "fusion_score alias does not match raw_fusion_score",
                "fusion_score": fusion_score,
                "raw_fusion_score": raw_fusion_score,
            })

if logic_issues:
    print("Fusion score logic issues found:")
    print(json.dumps(logic_issues[:10], indent=2))
else:
    print("Fusion score fields look valid.")


print("\nChecking dynamic weight behavior...")

dynamic_weight_issues = []

for item in fusion_result["timeline"]:
    fusion_mode = item.get("fusion_mode")
    used_weights = item.get("used_weights", {})

    video_weight_used = used_weights.get("video")
    audio_weight_used = used_weights.get("audio")

    if fusion_mode == "video_audio":
        if video_weight_used is None or audio_weight_used is None:
            dynamic_weight_issues.append({
                "window_index": item.get("window_index"),
                "issue": "video_audio mode missing used weights",
                "used_weights": used_weights,
            })
        elif abs((video_weight_used + audio_weight_used) - 1.0) > 1e-6:
            dynamic_weight_issues.append({
                "window_index": item.get("window_index"),
                "issue": "video_audio weights do not sum to 1",
                "used_weights": used_weights,
            })

    if fusion_mode == "video_only_audio_unavailable":
        if video_weight_used != 1.0 or audio_weight_used != 0.0:
            dynamic_weight_issues.append({
                "window_index": item.get("window_index"),
                "issue": "video-only mode should use 100% video and 0% audio",
                "used_weights": used_weights,
            })

        if item.get("raw_audio_score") is not None:
            dynamic_weight_issues.append({
                "window_index": item.get("window_index"),
                "issue": "raw_audio_score should be None when audio is unavailable",
                "raw_audio_score": item.get("raw_audio_score"),
            })

    if fusion_mode == "audio_only_video_unavailable":
        if video_weight_used != 0.0 or audio_weight_used != 1.0:
            dynamic_weight_issues.append({
                "window_index": item.get("window_index"),
                "issue": "audio-only mode should use 0% video and 100% audio",
                "used_weights": used_weights,
            })

if dynamic_weight_issues:
    print("Dynamic weight issues found:")
    print(json.dumps(dynamic_weight_issues[:10], indent=2))
else:
    print("Dynamic weight behavior looks valid.")


print("\nFusion mode counts:")

fusion_mode_counts = {}

for item in fusion_result["timeline"]:
    fusion_mode = item.get("fusion_mode", "unknown")
    fusion_mode_counts[fusion_mode] = fusion_mode_counts.get(fusion_mode, 0) + 1

print(json.dumps(fusion_mode_counts, indent=2))


print("\nFirst 3 fusion timeline items:")

for item in fusion_result["timeline"][:3]:
    print(json.dumps(item, indent=2))


print("\nCompact fusion preview:")

for item in fusion_result["timeline"][:10]:
    print(
        f"Window {item.get('window_index')} | "
        f"{item.get('start')}s-{item.get('end')}s | "
        f"raw_fusion={item.get('raw_fusion_score'):.4f} | "
        f"smoothed_fusion={item.get('smoothed_fusion_score'):.4f} | "
        f"risk={item.get('risk')} | "
        f"mode={item.get('fusion_mode')} | "
        f"weights={item.get('used_weights')}"
    )