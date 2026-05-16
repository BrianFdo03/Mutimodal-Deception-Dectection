import numpy as np


def summarize_audio_window_features(feature_matrix):
    """
    Creates basic explanation features from one scaled audio window.

    feature_matrix shape:
    (time_steps, feature_count)

    Since features are scaled, these values describe relative activity/variation,
    not raw physical acoustic units.
    """

    feature_std = np.std(feature_matrix, axis=0)
    feature_mean_abs = np.mean(np.abs(feature_matrix), axis=0)

    mfcc_variation = float(np.mean(feature_std[0:13]))
    delta_variation = float(np.mean(feature_std[13:26]))
    delta2_variation = float(np.mean(feature_std[26:39]))

    rms_activity = float(feature_mean_abs[39])
    zcr_activity = float(feature_mean_abs[40])
    spectral_activity = float(np.mean(feature_mean_abs[41:44]))
    pitch_activity = float(feature_mean_abs[44])
    voicing_activity = float(feature_mean_abs[45])

    return {
        "mfcc_variation": mfcc_variation,
        "delta_mfcc_variation": delta_variation,
        "delta2_mfcc_variation": delta2_variation,
        "rms_activity": rms_activity,
        "zcr_activity": zcr_activity,
        "spectral_activity": spectral_activity,
        "pitch_activity": pitch_activity,
        "voicing_activity": voicing_activity,
    }


def generate_audio_explanation(feature_summary, score):
    """
    Generates human-readable explanation for an audio timeline window.
    """

    factors = []

    if feature_summary["pitch_activity"] > 0.8:
        factors.append("higher pitch activity")

    if feature_summary["rms_activity"] > 0.8:
        factors.append("increased vocal energy variation")

    if feature_summary["mfcc_variation"] > 0.8:
        factors.append("higher spectral envelope variation")

    if feature_summary["delta_mfcc_variation"] > 0.8:
        factors.append("rapid short-term acoustic changes")

    if feature_summary["voicing_activity"] < 0.2:
        factors.append("lower voiced speech activity or possible silence")

    if not factors:
        factors.append("moderate acoustic variation")

    if score >= 0.70:
        summary = "High audio inconsistency was detected in this segment."
    elif score >= 0.45:
        summary = "Moderate audio inconsistency was detected in this segment."
    else:
        summary = "Low audio inconsistency was detected in this segment."

    detail = (
        summary
        + " Main contributing acoustic patterns include "
        + ", ".join(factors)
        + "."
    )

    return {
        "summary": summary,
        "detail": detail,
        "main_factors": factors,
        "feature_summary": feature_summary,
    }