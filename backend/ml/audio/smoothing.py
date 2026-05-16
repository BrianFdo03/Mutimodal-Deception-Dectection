import numpy as np


def smooth_scores(scores, smoothing_window=3):
    """
    Applies simple moving-average smoothing to audio timeline scores.
    """

    scores = np.array(scores, dtype=np.float32)

    if len(scores) < smoothing_window:
        return scores

    smoothed = []
    half_window = smoothing_window // 2

    for i in range(len(scores)):
        start = max(0, i - half_window)
        end = min(len(scores), i + half_window + 1)

        smoothed.append(np.mean(scores[start:end]))

    return np.array(smoothed, dtype=np.float32)


def classify_audio_risk(score):
    """
    Converts score to risk label.
    """

    if score >= 0.70:
        return "high"

    if score >= 0.45:
        return "medium"

    return "low"