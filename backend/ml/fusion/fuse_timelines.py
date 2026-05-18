from typing import Dict, List, Any


DEFAULT_VIDEO_WEIGHT = 0.2
DEFAULT_AUDIO_WEIGHT = 0.8


def classify_fusion_risk(score: float) -> str:
    """
    Converts fused score into a risk label.
    """

    if score >= 0.70:
        return "high"

    if score >= 0.45:
        return "medium"

    return "low"


def get_raw_score_from_item(item: Dict[str, Any]) -> float:
    """
    Gets the raw model score from a timeline item.

    This score is used for fusion decision-making.
    """

    if "raw_score" in item:
        return float(item["raw_score"])

    if "smoothed_score" in item:
        return float(item["smoothed_score"])

    return 0.0


def get_display_score_from_item(item: Dict[str, Any]) -> float:
    """
    Gets the smoothed/display score from a timeline item.

    This score is used only for timeline visualization and reviewer-facing display.
    """

    if "smoothed_score" in item:
        return float(item["smoothed_score"])

    if "display_score" in item:
        return float(item["display_score"])

    return get_raw_score_from_item(item)


def get_time_range(item: Dict[str, Any]):
    """
    Safely gets start/end time from a timeline item.
    Supports slightly different timeline field names.
    """

    start = item.get("start", item.get("start_time", 0.0))
    end = item.get("end", item.get("end_time", start))

    return float(start), float(end)


def calculate_overlap(start_a, end_a, start_b, end_b) -> float:
    """
    Calculates overlap duration between two time windows.
    """

    overlap_start = max(start_a, start_b)
    overlap_end = min(end_a, end_b)

    return max(0.0, overlap_end - overlap_start)


def find_best_matching_audio_item(
    video_item: Dict[str, Any],
    audio_timeline: List[Dict[str, Any]]
):
    """
    Finds the audio window with the largest time overlap
    for a given video timeline item.
    """

    video_start, video_end = get_time_range(video_item)

    best_audio_item = None
    best_overlap = 0.0

    for audio_item in audio_timeline:
        audio_start, audio_end = get_time_range(audio_item)

        overlap = calculate_overlap(
            video_start,
            video_end,
            audio_start,
            audio_end
        )

        if overlap > best_overlap:
            best_overlap = overlap
            best_audio_item = audio_item

    return best_audio_item, best_overlap


def normalize_weights(video_weight: float, audio_weight: float):
    """
    Ensures weights sum to 1.
    """

    total = video_weight + audio_weight

    if total <= 0:
        return DEFAULT_VIDEO_WEIGHT, DEFAULT_AUDIO_WEIGHT

    return video_weight / total, audio_weight / total


def generate_fusion_explanation(
    fusion_score: float,
    video_score: float,
    audio_score: float,
    video_item: Dict[str, Any],
    audio_item: Dict[str, Any] | None
):
    """
    Combines video and audio explanation information into one reviewer-facing explanation.
    """

    video_explanation = video_item.get("explanation", {})
    audio_explanation = audio_item.get("explanation", {}) if audio_item else {}

    video_factors = []
    audio_factors = []

    if isinstance(video_explanation, dict):
        video_factors = video_explanation.get("main_factors", [])
    elif isinstance(video_explanation, str):
        video_factors = [video_explanation]

    if isinstance(audio_explanation, dict):
        audio_factors = audio_explanation.get("main_factors", [])
    elif isinstance(audio_explanation, str):
        audio_factors = [audio_explanation]

    if fusion_score >= 0.70:
        summary = "High multimodal inconsistency was detected in this segment."
    elif fusion_score >= 0.45:
        summary = "Moderate multimodal inconsistency was detected in this segment."
    else:
        summary = "Low multimodal inconsistency was detected in this segment."

    modality_notes = []

    if video_score >= 0.45:
        modality_notes.append("visual cues contributed to the fused score")

    if audio_score >= 0.45:
        modality_notes.append("audio cues contributed to the fused score")

    if not modality_notes:
        modality_notes.append("both modalities showed limited inconsistency")

    detail = (
        summary
        + " The fusion result was calculated from synchronized visual and audio timeline scores. "
        + "Main contribution: "
        + ", ".join(modality_notes)
        + "."
    )

    return {
        "summary": summary,
        "detail": detail,
        "video_factors": video_factors,
        "audio_factors": audio_factors,
        "video_score": float(video_score),
        "audio_score": float(audio_score),
        "fusion_score": float(fusion_score),
    }

def smooth_fusion_scores(scores: List[float], smoothing_window: int = 3) -> List[float]:
    """
    Smooths fused scores for timeline display only.
    """

    if len(scores) < smoothing_window:
        return [float(score) for score in scores]

    smoothed_scores = []
    half_window = smoothing_window // 2

    for index in range(len(scores)):
        start = max(0, index - half_window)
        end = min(len(scores), index + half_window + 1)

        window_average = sum(scores[start:end]) / (end - start)
        smoothed_scores.append(float(window_average))

    return smoothed_scores


def calculate_dynamic_fusion_score(
    raw_video_score: float | None,
    raw_audio_score: float | None,
    video_available: bool,
    audio_available: bool,
    video_weight: float,
    audio_weight: float
):
    """
    Calculates fusion score using only available modalities.

    If both modalities are available, normalized configured weights are used.
    If only one modality is available, that modality receives 100% weight.
    """

    if video_available and audio_available:
        normalized_video_weight, normalized_audio_weight = normalize_weights(
            video_weight,
            audio_weight
        )

        fusion_score = (
            normalized_video_weight * raw_video_score
            + normalized_audio_weight * raw_audio_score
        )

        used_weights = {
            "video": float(normalized_video_weight),
            "audio": float(normalized_audio_weight),
        }

        fusion_mode = "video_audio"

    elif video_available:
        fusion_score = raw_video_score

        used_weights = {
            "video": 1.0,
            "audio": 0.0,
        }

        fusion_mode = "video_only_audio_unavailable"

    elif audio_available:
        fusion_score = raw_audio_score

        used_weights = {
            "video": 0.0,
            "audio": 1.0,
        }

        fusion_mode = "audio_only_video_unavailable"

    else:
        fusion_score = 0.0

        used_weights = {
            "video": 0.0,
            "audio": 0.0,
        }

        fusion_mode = "no_modalities_available"

    return float(fusion_score), used_weights, fusion_mode


def fuse_video_audio_timelines(
    video_result: Dict[str, Any],
    audio_result: Dict[str, Any],
    video_weight: float = DEFAULT_VIDEO_WEIGHT,
    audio_weight: float = DEFAULT_AUDIO_WEIGHT
):
    """
    Fuses video and audio timeline outputs using weighted late fusion.

    Args:
        video_result: output from predict_video_timeline(video_path)
        audio_result: output from predict_audio_timeline(video_path)
        video_weight: contribution of video model
        audio_weight: contribution of audio model

    Returns:
        dict containing fused multimodal timeline result.
    """

    video_weight, audio_weight = normalize_weights(
        video_weight,
        audio_weight
    )

    video_timeline = video_result.get("timeline", [])
    audio_timeline = audio_result.get("timeline", [])

    fused_timeline = []

    for index, video_item in enumerate(video_timeline):
        video_start, video_end = get_time_range(video_item)

        raw_video_score = get_raw_score_from_item(video_item)
        display_video_score = get_display_score_from_item(video_item)

        audio_item, overlap = find_best_matching_audio_item(
            video_item=video_item,
            audio_timeline=audio_timeline
        )

        video_available = video_item is not None
        audio_available = audio_item is not None and overlap > 0

        if audio_available:
            raw_audio_score = get_raw_score_from_item(audio_item)
            display_audio_score = get_display_score_from_item(audio_item)
            audio_start, audio_end = get_time_range(audio_item)
            audio_window_index = audio_item.get("window_index")
        else:
            raw_audio_score = None
            display_audio_score = None
            audio_start = None
            audio_end = None
            audio_window_index = None

        raw_fusion_score, used_weights, fusion_mode = calculate_dynamic_fusion_score(
            raw_video_score=raw_video_score,
            raw_audio_score=raw_audio_score,
            video_available=video_available,
            audio_available=audio_available,
            video_weight=video_weight,
            audio_weight=audio_weight,
        )

        fusion_risk = classify_fusion_risk(raw_fusion_score)

        explanation = generate_fusion_explanation(
            fusion_score=raw_fusion_score,
            video_score=raw_video_score,
            audio_score=raw_audio_score,
            video_item=video_item,
            audio_item=audio_item
        )

        fused_timeline.append({
            "window_index": int(index),
            "start": float(video_start),
            "end": float(video_end),

            "raw_fusion_score": float(raw_fusion_score),
            "smoothed_fusion_score": None,
            "display_score": None,
            "fusion_score": float(raw_fusion_score),

            "risk": fusion_risk,

            "raw_video_score": float(raw_video_score) if raw_video_score is not None else None,
            "raw_audio_score": float(raw_audio_score) if raw_audio_score is not None else None,

            "display_video_score": float(display_video_score) if display_video_score is not None else None,
            "display_audio_score": float(display_audio_score) if display_audio_score is not None else None,

            "video_available": video_available,
            "audio_available": audio_available,
            "fusion_mode": fusion_mode,
            "used_weights": used_weights,

            "video_risk": video_item.get("risk", None),
            "audio_risk": audio_item.get("risk", None) if audio_available else None,

            "video_window_index": video_item.get("window_index", index),
            "audio_window_index": audio_window_index,
            "audio_match_overlap": float(overlap),
            "audio_start": audio_start,
            "audio_end": audio_end,

            "modality": "fusion",
            "explanation": explanation,
        })

    # Fill smoothed/display fusion scores after all raw fusion scores are available
    raw_fusion_scores = [
        item["raw_fusion_score"]
        for item in fused_timeline
    ]

    smoothed_fusion_scores = smooth_fusion_scores(
        raw_fusion_scores,
        smoothing_window=3
    )

    for item, smoothed_score in zip(fused_timeline, smoothed_fusion_scores):
        item["smoothed_fusion_score"] = float(smoothed_score)
        item["display_score"] = float(smoothed_score)

    # Now calculate summary values
    overall_score = calculate_overall_fusion_score(fused_timeline)
    overall_display_score = calculate_overall_display_score(fused_timeline)
    overall_risk = classify_fusion_risk(overall_score)
    risk_counts = count_fusion_risks(fused_timeline)

    return {
        "video_name": video_result.get("video_name") or audio_result.get("video_name"),
        "overall_score": float(overall_score),
        "overall_display_score": float(overall_display_score),
        "overall_risk": overall_risk,
        "risk_counts": risk_counts,
        "weights": {
            "video": float(video_weight),
            "audio": float(audio_weight),
        },
        "metadata": {
            "fusion_method": "weighted_late_fusion_dynamic_weights",
            "decision_score": "raw_fusion_score",
            "display_score": "smoothed_fusion_score",
            "video_timeline_items": int(len(video_timeline)),
            "audio_timeline_items": int(len(audio_timeline)),
            "fused_timeline_items": int(len(fused_timeline)),
        },
        "timeline": fused_timeline,
    }


def calculate_overall_fusion_score(fused_timeline: List[Dict[str, Any]]) -> float:
    """
    Calculates average fused score.
    """

    if not fused_timeline:
        return 0.0

    scores = [
        float(item["raw_fusion_score"])
        for item in fused_timeline
    ]

    return sum(scores) / len(scores)


def calculate_overall_display_score(fused_timeline: List[Dict[str, Any]]) -> float:
    """
    Calculates average smoothed fused score for display.

    Falls back to raw_fusion_score if smoothed_fusion_score is missing or None.
    """

    if not fused_timeline:
        return 0.0

    scores = []

    for item in fused_timeline:
        smoothed_score = item.get("smoothed_fusion_score")

        if smoothed_score is None:
            smoothed_score = item.get("raw_fusion_score", 0.0)

        scores.append(float(smoothed_score))

    return sum(scores) / len(scores)


def count_fusion_risks(fused_timeline: List[Dict[str, Any]]):
    """
    Counts high/medium/low fused risk labels.
    """

    return {
        "high": sum(1 for item in fused_timeline if item["risk"] == "high"),
        "medium": sum(1 for item in fused_timeline if item["risk"] == "medium"),
        "low": sum(1 for item in fused_timeline if item["risk"] == "low"),
    }