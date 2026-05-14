import numpy as np


# Approximate MediaPipe Face Landmarker region groups.
# These indices are based on common MediaPipe face mesh landmark regions.
FACE_REGIONS = {
    "mouth": [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
        78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308
    ],

    "left_eye": [
        33, 160, 158, 133, 153, 144,
        246, 161, 159, 157, 173
    ],

    "right_eye": [
        362, 385, 387, 263, 373, 380,
        466, 388, 386, 384, 398
    ],

    "left_eyebrow": [
        70, 63, 105, 66, 107
    ],

    "right_eyebrow": [
        336, 296, 334, 293, 300
    ],

    "nose": [
        1, 2, 98, 327, 168, 197, 5, 4
    ],

    "face_outline": [
        10, 152, 234, 454, 127, 356, 93, 323
    ],
}


def _safe_region_indices(indices, landmark_count):
    """
    Keeps only landmark indices that exist in the extracted landmark set.
    This avoids index errors if MediaPipe returns a different landmark count.
    """

    return [index for index in indices if 0 <= index < landmark_count]


def reshape_window_to_landmarks(window):
    """
    Converts a flattened LSTM window into landmark coordinates.

    Input:
        window shape = (window_size, feature_dim)
        example = (25, 1434)

    Output:
        landmarks shape = (window_size, landmark_count, 3)
        example = (25, 478, 3)
    """

    window = np.array(window, dtype=np.float32)

    if window.ndim != 2:
        raise ValueError(
            f"Expected window shape (frames, features), got {window.shape}"
        )

    frame_count, feature_dim = window.shape

    if feature_dim % 3 != 0:
        raise ValueError(
            f"Feature dimension must be divisible by 3, got {feature_dim}"
        )

    landmark_count = feature_dim // 3

    return window.reshape(frame_count, landmark_count, 3)


def calculate_region_movement_scores(window):
    """
    Calculates movement/variation score for each facial region in one window.

    Method:
        1. Reshape flattened features into landmarks.
        2. Calculate frame-to-frame Euclidean movement.
        3. Average movement for each facial region.

    Returns:
        dictionary of region movement scores.
    """

    landmarks = reshape_window_to_landmarks(window)

    frame_count, landmark_count, _ = landmarks.shape

    if frame_count < 2:
        return {
            "mouth": 0.0,
            "eyes": 0.0,
            "eyebrows": 0.0,
            "nose": 0.0,
            "head_motion": 0.0,
            "overall_motion": 0.0,
        }

    # Shape: (frame_count - 1, landmark_count, 3)
    frame_differences = np.diff(landmarks, axis=0)

    # Euclidean distance per landmark between consecutive frames.
    # Shape: (frame_count - 1, landmark_count)
    landmark_motion = np.linalg.norm(frame_differences, axis=2)

    def region_score(region_name):
        indices = _safe_region_indices(FACE_REGIONS[region_name], landmark_count)

        if not indices:
            return 0.0

        return float(np.mean(landmark_motion[:, indices]))

    mouth_score = region_score("mouth")

    left_eye_indices = _safe_region_indices(FACE_REGIONS["left_eye"], landmark_count)
    right_eye_indices = _safe_region_indices(FACE_REGIONS["right_eye"], landmark_count)
    eye_indices = left_eye_indices + right_eye_indices
    eyes_score = float(np.mean(landmark_motion[:, eye_indices])) if eye_indices else 0.0

    left_brow_indices = _safe_region_indices(FACE_REGIONS["left_eyebrow"], landmark_count)
    right_brow_indices = _safe_region_indices(FACE_REGIONS["right_eyebrow"], landmark_count)
    eyebrow_indices = left_brow_indices + right_brow_indices
    eyebrows_score = (
        float(np.mean(landmark_motion[:, eyebrow_indices]))
        if eyebrow_indices
        else 0.0
    )

    nose_score = region_score("nose")

    face_outline_indices = _safe_region_indices(
        FACE_REGIONS["face_outline"],
        landmark_count
    )
    nose_indices = _safe_region_indices(FACE_REGIONS["nose"], landmark_count)
    head_indices = face_outline_indices + nose_indices
    head_motion_score = (
        float(np.mean(landmark_motion[:, head_indices]))
        if head_indices
        else 0.0
    )

    overall_motion = float(np.mean(landmark_motion))

    return {
        "mouth": round(mouth_score, 6),
        "eyes": round(eyes_score, 6),
        "eyebrows": round(eyebrows_score, 6),
        "nose": round(nose_score, 6),
        "head_motion": round(head_motion_score, 6),
        "overall_motion": round(overall_motion, 6),
    }


def get_top_explanation_factors(region_scores, max_factors=3):
    """
    Converts the highest region movement scores into readable explanation factors.
    """

    readable_labels = {
        "mouth": "Increased mouth-region movement",
        "eyes": "Higher eye-region variation",
        "eyebrows": "Increased eyebrow-region movement",
        "nose": "Nose-region landmark variation",
        "head_motion": "Head-position instability",
        "overall_motion": "Overall facial movement variation",
    }

    # Exclude overall_motion from top factors unless everything else is very low.
    ranking_candidates = {
        key: value
        for key, value in region_scores.items()
        if key != "overall_motion"
    }

    sorted_regions = sorted(
        ranking_candidates.items(),
        key=lambda item: item[1],
        reverse=True
    )

    factors = []

    for region_name, score in sorted_regions[:max_factors]:
        if score > 0:
            factors.append(readable_labels[region_name])

    if not factors and region_scores.get("overall_motion", 0) > 0:
        factors.append(readable_labels["overall_motion"])

    return factors


def generate_segment_explanation(region_scores, risk):
    """
    Generates human-readable explanation text for one timeline segment.
    """

    main_factors = get_top_explanation_factors(region_scores)

    if risk == "high":
        summary = (
            "High facial-behavior inconsistency was detected in this segment. "
            "This segment should be reviewed carefully by the interviewer."
        )

    elif risk == "medium":
        summary = (
            "Moderate facial-behavior inconsistency was detected in this segment. "
            "This segment may be useful for interviewer review."
        )

    else:
        summary = (
            "No major facial-behavior inconsistency was detected in this segment."
        )

    if risk in ["medium", "high"] and main_factors:
        detail = (
            "The strongest observable contributors were: "
            + ", ".join(main_factors)
            + "."
        )
    else:
        detail = (
            "The facial movement pattern remained relatively stable within this window."
        )

    return {
        "summary": summary,
        "detail": detail,
        "main_factors": main_factors,
        "region_scores": region_scores,
        "interpretation_note": (
            "This explanation describes facial landmark movement variation. "
            "It should be interpreted as a review aid, not as proof of deception."
        )
    }


def generate_explanations_for_windows(X_windows, risks):
    """
    Generates explanation objects for all inference windows.

    Args:
        X_windows: numpy array of shape (num_windows, window_size, feature_dim)
        risks: list/array of risk labels for each window

    Returns:
        list of explanation dictionaries
    """

    explanations = []

    for window, risk in zip(X_windows, risks):
        region_scores = calculate_region_movement_scores(window)
        explanation = generate_segment_explanation(region_scores, risk)
        explanations.append(explanation)

    return explanations