from pathlib import Path

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from backend.ml.video.frame_extraction import extract_sampled_frames
from backend.ml.video.preprocessing import normalize_landmarks


CURRENT_FILE = Path(__file__).resolve()
VIDEO_DIR = CURRENT_FILE.parent

FACE_LANDMARKER_MODEL_PATH = (
    VIDEO_DIR / "mediapipe_models" / "face_landmarker.task"
)


def create_video_landmarker():
    """
    Creates a fresh MediaPipe FaceLandmarker in VIDEO mode.

    Important:
    A new landmarker should be created per video so timestamps can start from 0.
    """

    if not FACE_LANDMARKER_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Face landmarker model not found: {FACE_LANDMARKER_MODEL_PATH}"
        )

    BaseOptions = python.BaseOptions
    FaceLandmarker = vision.FaceLandmarker
    FaceLandmarkerOptions = vision.FaceLandmarkerOptions
    VisionRunningMode = vision.RunningMode

    options = FaceLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=str(FACE_LANDMARKER_MODEL_PATH)
        ),
        running_mode=VisionRunningMode.VIDEO,
        num_faces=1,
        min_face_detection_confidence=0.25,
        min_face_presence_confidence=0.25,
        min_tracking_confidence=0.25,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False
    )

    return FaceLandmarker.create_from_options(options)


def extract_landmarks_from_frame_bgr_video_mode(
    frame_bgr,
    timestamp_ms,
    landmarker
):
    """
    Extract landmarks from one BGR frame using MediaPipe VIDEO mode.
    """

    if frame_bgr is None:
        return None

    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    frame_rgb = np.ascontiguousarray(frame_rgb, dtype=np.uint8)

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=frame_rgb
    )

    result = landmarker.detect_for_video(mp_image, timestamp_ms)

    if not result.face_landmarks:
        return None

    face_landmarks = result.face_landmarks[0]

    landmarks = []

    for landmark in face_landmarks:
        landmarks.append([
            landmark.x,
            landmark.y,
            landmark.z
        ])

    return np.array(landmarks, dtype=np.float32)


def extract_landmark_sequence_from_video(video_path, target_fps=5):
    """
    Converts a full video into a normalized landmark sequence.

    Returns:
        sequence: numpy array of shape (valid_frames, feature_dim)
        valid_frame_indices: list of original frame indices
        metadata: dictionary
    """

    video_path = Path(video_path)

    frames, frame_indices, metadata = extract_sampled_frames(
        video_path=video_path,
        target_fps=target_fps
    )

    original_fps = metadata["original_fps"]

    sequence = []
    valid_frame_indices = []
    missing_count = 0

    previous_timestamp_ms = -1

    with create_video_landmarker() as video_landmarker:
        for frame_bgr, original_frame_index in zip(frames, frame_indices):
            timestamp_ms = int((original_frame_index / original_fps) * 1000)

            if timestamp_ms <= previous_timestamp_ms:
                timestamp_ms = previous_timestamp_ms + 1

            previous_timestamp_ms = timestamp_ms

            landmarks = extract_landmarks_from_frame_bgr_video_mode(
                frame_bgr=frame_bgr,
                timestamp_ms=timestamp_ms,
                landmarker=video_landmarker
            )

            if landmarks is None:
                missing_count += 1
                continue

            normalized = normalize_landmarks(landmarks)

            if normalized is None:
                missing_count += 1
                continue

            sequence.append(normalized)
            valid_frame_indices.append(original_frame_index)

    if len(sequence) == 0:
        raise ValueError("No valid face landmarks were extracted from this video.")

    sequence = np.array(sequence, dtype=np.float32)

    metadata["valid_landmark_frames"] = int(sequence.shape[0])
    metadata["missing_landmark_frames"] = int(missing_count)
    metadata["feature_dim"] = int(sequence.shape[1])

    return sequence, valid_frame_indices, metadata