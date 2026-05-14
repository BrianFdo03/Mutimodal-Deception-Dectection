from pathlib import Path
import json

import tensorflow as tf

from backend.ml.video.landmark_extraction import extract_landmark_sequence_from_video
from backend.ml.video.windowing import create_inference_windows, add_timestamp_columns
from backend.ml.video.smoothing import smooth_scores, assign_risk
from backend.ml.video.explainability import generate_explanations_for_windows


CURRENT_FILE = Path(__file__).resolve()
VIDEO_DIR = CURRENT_FILE.parent

MODEL_PATH = VIDEO_DIR / "model" / "final_video_bilstm_model.keras"
CONFIG_PATH = VIDEO_DIR / "config" / "preprocessing_config.json"


_model = None
_config = None


def load_config():
    global _config

    if _config is not None:
        return _config

    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Preprocessing config not found: {CONFIG_PATH}")

    with open(CONFIG_PATH, "r") as f:
        _config = json.load(f)

    return _config


def load_video_model():
    global _model

    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Video model not found: {MODEL_PATH}")

    _model = tf.keras.models.load_model(MODEL_PATH)

    return _model


def predict_video_timeline(video_path):
    """
    Main backend ML function.

    Args:
        video_path: path to uploaded video

    Returns:
        dictionary containing overall score and timeline list
    """

    video_path = Path(video_path)

    config = load_config()
    model = load_video_model()

    target_fps = config["target_fps"]
    window_size = config["window_size"]
    stride = config["stride"]
    feature_dim = config["feature_dim"]

    sequence, valid_frame_indices, metadata = extract_landmark_sequence_from_video(
        video_path=video_path,
        target_fps=target_fps
    )

    if sequence.shape[1] != feature_dim:
        raise ValueError(
            f"Feature dimension mismatch. Model expects {feature_dim}, "
            f"but extracted sequence has {sequence.shape[1]}."
        )

    X_infer, window_info = create_inference_windows(
        sequence=sequence,
        window_size=window_size,
        stride=stride
    )

    window_info = add_timestamp_columns(
        window_info=window_info,
        target_fps=target_fps
    )

    raw_scores = model.predict(X_infer, verbose=0).ravel()

    window_info["raw_score"] = raw_scores
    window_info["smoothed_score"] = smooth_scores(raw_scores, alpha=0.6)
    window_info["risk"] = window_info["smoothed_score"].apply(assign_risk)

    explanations = generate_explanations_for_windows(
        X_windows=X_infer,
        risks=window_info["risk"].tolist()
    )

    window_info["explanation"] = explanations

    overall_score = float(window_info["smoothed_score"].mean())
    overall_risk = assign_risk(overall_score)

    timeline = []

    for _, row in window_info.iterrows():
        timeline.append({
            "window_index": int(row["window_index"]),
            "start": round(float(row["start_time"]), 2),
            "end": round(float(row["end_time"]), 2),
            "raw_score": round(float(row["raw_score"]), 4),
            "smoothed_score": round(float(row["smoothed_score"]), 4),
            "risk": row["risk"],
            "explanation": row["explanation"]
        })

    return {
        "video_name": video_path.name,
        "overall_score": round(overall_score, 4),
        "overall_risk": overall_risk,
        "metadata": metadata,
        "timeline": timeline
    }