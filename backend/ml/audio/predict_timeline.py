from pathlib import Path
import json

import joblib
import numpy as np
import tensorflow as tf

from backend.ml.audio.audio_extraction import extract_audio_from_video
from backend.ml.audio.feature_extraction import (
    create_audio_inference_windows,
    scale_audio_features,
)
from backend.ml.audio.smoothing import (
    smooth_scores,
    classify_audio_risk,
)
from backend.ml.audio.explainability import (
    summarize_audio_window_features,
    generate_audio_explanation,
)


AUDIO_DIR = Path(__file__).resolve().parent

CONFIG_DIR = AUDIO_DIR / "config"
MODEL_DIR = AUDIO_DIR / "model"
TEMP_AUDIO_DIR = AUDIO_DIR / "temp_audio"

FEATURE_INFO_PATH = CONFIG_DIR / "feature_info.json"
SCALER_PATH = CONFIG_DIR / "audio_feature_scaler.pkl"
MODEL_PATH = MODEL_DIR / "final_audio_bilstm_model.keras"

TEMP_AUDIO_DIR.mkdir(parents=True, exist_ok=True)


_audio_model = None
_audio_scaler = None
_feature_info = None


def load_audio_assets():
    """
    Lazy-loads model, scaler, and feature config once.
    """

    global _audio_model, _audio_scaler, _feature_info

    if _feature_info is None:
        if not FEATURE_INFO_PATH.exists():
            raise FileNotFoundError(f"Feature info not found: {FEATURE_INFO_PATH}")

        with open(FEATURE_INFO_PATH, "r") as file:
            _feature_info = json.load(file)

    if _audio_scaler is None:
        if not SCALER_PATH.exists():
            raise FileNotFoundError(f"Audio scaler not found: {SCALER_PATH}")

        _audio_scaler = joblib.load(SCALER_PATH)

    if _audio_model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Audio model not found: {MODEL_PATH}")

        _audio_model = tf.keras.models.load_model(MODEL_PATH)

    return _audio_model, _audio_scaler, _feature_info


def compute_overall_audio_result(timeline):
    """
    Computes overall audio score and risk from timeline.
    """

    if not timeline:
        return {
            "overall_score": 0.0,
            "overall_risk": "low",
            "risk_counts": {
                "high": 0,
                "medium": 0,
                "low": 0,
            }
        }

    scores = [item["smoothed_score"] for item in timeline]

    overall_score = float(np.mean(scores))

    high_count = sum(1 for item in timeline if item["risk"] == "high")
    medium_count = sum(1 for item in timeline if item["risk"] == "medium")
    low_count = sum(1 for item in timeline if item["risk"] == "low")

    if overall_score >= 0.70:
        overall_risk = "high"
    elif overall_score >= 0.45:
        overall_risk = "medium"
    else:
        overall_risk = "low"

    return {
        "overall_score": overall_score,
        "overall_risk": overall_risk,
        "risk_counts": {
            "high": int(high_count),
            "medium": int(medium_count),
            "low": int(low_count),
        }
    }


def predict_audio_timeline(video_path):
    """
    Runs full audio timeline inference on a video file.

    Args:
        video_path: Path to uploaded/interview video.

    Returns:
        dict containing audio score, risk, metadata, and timeline.
    """

    video_path = Path(video_path)

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    audio_model, scaler, feature_info = load_audio_assets()

    sample_rate = int(feature_info["sample_rate"])
    window_seconds = float(feature_info["window_seconds"])
    stride_seconds = float(feature_info["stride_seconds"])
    frame_length_seconds = float(feature_info["frame_length_seconds"])
    frame_hop_seconds = float(feature_info["frame_hop_seconds"])
    target_audio_frames = int(feature_info["target_audio_frames"])
    n_mfcc = int(feature_info["n_mfcc"])
    feature_count = int(feature_info["feature_count"])

    wav_path = extract_audio_from_video(
        video_path=video_path,
        output_dir=TEMP_AUDIO_DIR,
        sample_rate=sample_rate
    )

    X_raw, window_info, audio_duration = create_audio_inference_windows(
        wav_path=wav_path,
        sample_rate=sample_rate,
        window_seconds=window_seconds,
        stride_seconds=stride_seconds,
        frame_length_seconds=frame_length_seconds,
        frame_hop_seconds=frame_hop_seconds,
        n_mfcc=n_mfcc,
        target_audio_frames=target_audio_frames
    )

    X_scaled = scale_audio_features(
        X_raw=X_raw,
        scaler=scaler,
        expected_feature_count=feature_count
    )

    raw_scores = audio_model.predict(X_scaled, verbose=0).ravel()
    smoothed_scores = smooth_scores(raw_scores, smoothing_window=3)

    timeline = []

    for index, info in enumerate(window_info):
        raw_score = float(raw_scores[index])
        smoothed_score = float(smoothed_scores[index])
        risk = classify_audio_risk(smoothed_score)

        feature_summary = summarize_audio_window_features(X_scaled[index])
        explanation = generate_audio_explanation(
            feature_summary=feature_summary,
            score=smoothed_score
        )

        timeline.append({
            "window_index": int(info["window_index"]),
            "start": float(info["start"]),
            "end": float(info["end"]),
            "raw_score": raw_score,
            "smoothed_score": smoothed_score,
            "risk": risk,
            "modality": "audio",
            "explanation": explanation,
        })

    overall_audio = compute_overall_audio_result(timeline)

    result = {
        "video_name": video_path.name,
        "audio_file": str(wav_path),
        "overall_score": overall_audio["overall_score"],
        "overall_risk": overall_audio["overall_risk"],
        "risk_counts": overall_audio["risk_counts"],
        "metadata": {
            "sample_rate": sample_rate,
            "duration_seconds": float(audio_duration),
            "window_seconds": window_seconds,
            "stride_seconds": stride_seconds,
            "num_windows": int(len(timeline)),
            "model_path": str(MODEL_PATH),
            "feature_count": feature_count,
            "target_audio_frames": target_audio_frames,
        },
        "timeline": timeline,
    }

    return result