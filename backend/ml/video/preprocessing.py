import numpy as np


def normalize_landmarks(landmarks):
    """
    Normalize facial landmarks to reduce position and scale differences.

    Args:
        landmarks: numpy array of shape (N, 3)

    Returns:
        flattened normalized vector of shape (N * 3,)
    """

    landmarks = np.array(landmarks, dtype=np.float32)

    center = np.mean(landmarks, axis=0)
    centered_landmarks = landmarks - center

    min_vals = np.min(centered_landmarks, axis=0)
    max_vals = np.max(centered_landmarks, axis=0)

    face_size = np.linalg.norm(max_vals - min_vals)

    if face_size == 0:
        return None

    normalized_landmarks = centered_landmarks / face_size

    return normalized_landmarks.flatten().astype(np.float32)