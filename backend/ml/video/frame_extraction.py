from pathlib import Path
import cv2


def extract_sampled_frames(video_path, target_fps=5):
    """
    Extract sampled frames from a video using OpenCV.

    Returns:
        sampled_frames: list of BGR frames
        sampled_frame_indices: original frame indices
        metadata: video metadata
    """

    video_path = Path(video_path)

    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    original_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if original_fps <= 0:
        cap.release()
        raise ValueError("Invalid video FPS.")

    frame_interval = max(int(round(original_fps / target_fps)), 1)

    sampled_frames = []
    sampled_frame_indices = []

    frame_index = 0

    while True:
        ret, frame_bgr = cap.read()

        if not ret:
            break

        if frame_index % frame_interval == 0:
            sampled_frames.append(frame_bgr)
            sampled_frame_indices.append(frame_index)

        frame_index += 1

    cap.release()

    duration_seconds = total_frames / original_fps

    metadata = {
        "original_fps": float(original_fps),
        "target_fps": int(target_fps),
        "total_frames": int(total_frames),
        "sampled_frames": int(len(sampled_frames)),
        "duration_seconds": float(duration_seconds),
        "frame_interval": int(frame_interval)
    }

    return sampled_frames, sampled_frame_indices, metadata