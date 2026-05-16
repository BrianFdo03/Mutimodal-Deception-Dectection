import numpy as np
import librosa


def pad_or_trim_frames(feature_matrix, target_frames):
    current_frames = feature_matrix.shape[0]

    if current_frames == target_frames:
        return feature_matrix

    if current_frames > target_frames:
        return feature_matrix[:target_frames]

    pad_amount = target_frames - current_frames
    padding = np.zeros(
        (pad_amount, feature_matrix.shape[1]),
        dtype=np.float32
    )

    return np.vstack([feature_matrix, padding])


def extract_audio_features_from_window(
    y_window,
    sr,
    frame_length_seconds,
    frame_hop_seconds,
    n_mfcc,
    target_audio_frames
):
    """
    Extracts frame-level acoustic features from one audio window.

    Feature layout:
    0:13   MFCC
    13:26  Delta MFCC
    26:39  Delta-delta MFCC
    39     RMS
    40     ZCR
    41     Spectral centroid
    42     Spectral bandwidth
    43     Spectral rolloff
    44     Pitch/F0
    45     Voicing probability
    """

    frame_length = int(frame_length_seconds * sr)
    hop_length = int(frame_hop_seconds * sr)

    if len(y_window) < frame_length:
        y_window = np.pad(y_window, (0, frame_length - len(y_window)))

    mfcc = librosa.feature.mfcc(
        y=y_window,
        sr=sr,
        n_mfcc=n_mfcc,
        n_fft=1024,
        hop_length=hop_length
    )

    delta_mfcc = librosa.feature.delta(mfcc)
    delta2_mfcc = librosa.feature.delta(mfcc, order=2)

    rms = librosa.feature.rms(
        y=y_window,
        frame_length=frame_length,
        hop_length=hop_length
    )

    zcr = librosa.feature.zero_crossing_rate(
        y_window,
        frame_length=frame_length,
        hop_length=hop_length
    )

    spectral_centroid = librosa.feature.spectral_centroid(
        y=y_window,
        sr=sr,
        n_fft=1024,
        hop_length=hop_length
    )

    spectral_bandwidth = librosa.feature.spectral_bandwidth(
        y=y_window,
        sr=sr,
        n_fft=1024,
        hop_length=hop_length
    )

    spectral_rolloff = librosa.feature.spectral_rolloff(
        y=y_window,
        sr=sr,
        n_fft=1024,
        hop_length=hop_length
    )

    try:
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y_window,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr,
            frame_length=1024,
            hop_length=hop_length
        )

        f0 = np.nan_to_num(f0, nan=0.0)
        voiced_probs = np.nan_to_num(voiced_probs, nan=0.0)

    except Exception:
        frame_count = mfcc.shape[1]
        f0 = np.zeros(frame_count)
        voiced_probs = np.zeros(frame_count)

    min_frames = min(
        mfcc.shape[1],
        delta_mfcc.shape[1],
        delta2_mfcc.shape[1],
        rms.shape[1],
        zcr.shape[1],
        spectral_centroid.shape[1],
        spectral_bandwidth.shape[1],
        spectral_rolloff.shape[1],
        len(f0),
        len(voiced_probs)
    )

    feature_stack = np.vstack([
        mfcc[:, :min_frames],
        delta_mfcc[:, :min_frames],
        delta2_mfcc[:, :min_frames],
        rms[:, :min_frames],
        zcr[:, :min_frames],
        spectral_centroid[:, :min_frames],
        spectral_bandwidth[:, :min_frames],
        spectral_rolloff[:, :min_frames],
        f0[:min_frames].reshape(1, -1),
        voiced_probs[:min_frames].reshape(1, -1),
    ])

    feature_matrix = feature_stack.T.astype(np.float32)

    feature_matrix = pad_or_trim_frames(
        feature_matrix,
        target_audio_frames
    )

    return feature_matrix


def create_audio_inference_windows(
    wav_path,
    sample_rate,
    window_seconds,
    stride_seconds,
    frame_length_seconds,
    frame_hop_seconds,
    n_mfcc,
    target_audio_frames
):
    """
    Converts a WAV file into fixed-size audio feature windows.

    Returns:
        X_raw: np.ndarray shape (num_windows, time_steps, feature_count)
        window_info: list[dict]
        duration: float
    """

    y, sr = librosa.load(wav_path, sr=sample_rate, mono=True)

    duration = len(y) / sr

    if len(y) == 0:
        raise ValueError("Audio file is empty.")

    window_samples = int(window_seconds * sr)
    stride_samples = int(stride_seconds * sr)

    windows = []
    window_info = []

    if len(y) < window_samples:
        padded_y = np.pad(y, (0, window_samples - len(y)))

        feature_matrix = extract_audio_features_from_window(
            y_window=padded_y,
            sr=sr,
            frame_length_seconds=frame_length_seconds,
            frame_hop_seconds=frame_hop_seconds,
            n_mfcc=n_mfcc,
            target_audio_frames=target_audio_frames
        )

        windows.append(feature_matrix)

        window_info.append({
            "window_index": 0,
            "start": 0.0,
            "end": float(min(window_seconds, duration)),
            "duration": float(duration),
        })

    else:
        start_sample = 0
        window_index = 0

        while start_sample + window_samples <= len(y):
            end_sample = start_sample + window_samples
            y_window = y[start_sample:end_sample]

            feature_matrix = extract_audio_features_from_window(
                y_window=y_window,
                sr=sr,
                frame_length_seconds=frame_length_seconds,
                frame_hop_seconds=frame_hop_seconds,
                n_mfcc=n_mfcc,
                target_audio_frames=target_audio_frames
            )

            start_time = start_sample / sr
            end_time = end_sample / sr

            windows.append(feature_matrix)

            window_info.append({
                "window_index": int(window_index),
                "start": float(start_time),
                "end": float(end_time),
                "duration": float(duration),
            })

            start_sample += stride_samples
            window_index += 1

    X_raw = np.array(windows, dtype=np.float32)

    return X_raw, window_info, float(duration)


def scale_audio_features(X_raw, scaler, expected_feature_count):
    """
    Applies saved StandardScaler to inference windows.
    """

    num_windows, time_steps, feature_count = X_raw.shape

    if feature_count != expected_feature_count:
        raise ValueError(
            f"Feature count mismatch. Expected {expected_feature_count}, got {feature_count}."
        )

    X_reshaped = X_raw.reshape(-1, feature_count)
    X_scaled_reshaped = scaler.transform(X_reshaped)

    X_scaled = X_scaled_reshaped.reshape(
        num_windows,
        time_steps,
        feature_count
    ).astype(np.float32)

    X_scaled = np.nan_to_num(
        X_scaled,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    return X_scaled