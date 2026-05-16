from pathlib import Path
import shutil
import subprocess


def extract_audio_from_video(
    video_path: Path,
    output_dir: Path,
    sample_rate: int = 16000
) -> Path:
    """
    Extracts mono WAV audio from a video file using FFmpeg.

    Args:
        video_path: Path to input video.
        output_dir: Directory where extracted WAV should be saved.
        sample_rate: Target sample rate.

    Returns:
        Path to extracted WAV file.
    """

    video_path = Path(video_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if shutil.which("ffmpeg") is None:
        raise RuntimeError(
            "FFmpeg was not found in PATH. Install FFmpeg and restart the terminal."
        )

    output_wav_path = output_dir / f"{video_path.stem}_audio.wav"

    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(sample_rate),
        str(output_wav_path),
    ]

    result = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if result.returncode != 0:
        raise RuntimeError(
            "FFmpeg audio extraction failed.\n"
            f"Video: {video_path}\n"
            f"Error:\n{result.stderr}"
        )

    if not output_wav_path.exists():
        raise RuntimeError("Audio extraction failed. WAV file was not created.")

    return output_wav_path