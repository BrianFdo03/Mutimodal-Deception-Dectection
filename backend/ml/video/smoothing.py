import numpy as np


def smooth_scores(scores, alpha=0.6):
    """
    Exponential smoothing for timeline prediction scores.
    """

    scores = np.array(scores, dtype=np.float32)

    if len(scores) == 0:
        return scores

    smoothed = []
    previous = scores[0]

    for score in scores:
        new_score = alpha * previous + (1 - alpha) * score
        smoothed.append(new_score)
        previous = new_score

    return np.array(smoothed, dtype=np.float32)


def assign_risk(score):
    """
    Converts score into risk label.
    """

    if score >= 0.70:
        return "high"
    elif score >= 0.40:
        return "medium"
    else:
        return "low"