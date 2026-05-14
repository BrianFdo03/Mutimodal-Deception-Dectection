import numpy as np
import pandas as pd


def create_inference_windows(sequence, window_size=25, stride=10):
    """
    Converts one video landmark sequence into LSTM windows.

    Args:
        sequence: shape (frames, feature_dim)

    Returns:
        X_windows: shape (num_windows, window_size, feature_dim)
        window_info: dataframe with frame index information
    """

    X_windows = []
    window_records = []

    num_frames = sequence.shape[0]

    if num_frames < window_size:
        raise ValueError(
            f"Video has only {num_frames} valid frames, "
            f"but window size is {window_size}."
        )

    for start in range(0, num_frames - window_size + 1, stride):
        end = start + window_size
        window = sequence[start:end]

        X_windows.append(window)

        window_records.append({
            "window_index": len(window_records),
            "start_valid_frame": start,
            "end_valid_frame": end
        })

    X_windows = np.array(X_windows, dtype=np.float32)
    window_info = pd.DataFrame(window_records)

    return X_windows, window_info


def add_timestamp_columns(window_info, target_fps=5):
    """
    Adds start and end time columns based on sampled frame rate.
    """

    window_info = window_info.copy()

    window_info["start_time"] = (
        window_info["start_valid_frame"] / target_fps
    )

    window_info["end_time"] = (
        window_info["end_valid_frame"] / target_fps
    )

    return window_info