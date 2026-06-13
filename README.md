# Multimodal Deception Detection for Virtual Interviews

## Overview

This project is an AI-assisted web application that analyzes virtual interview recordings to identify behavioral inconsistencies using both **visual** and **acoustic** cues. Rather than making autonomous decisions, the system is designed as a **decision-support tool** that highlights potentially suspicious segments and presents explainable timeline-based insights for human review.

The project combines separate machine learning pipelines for video and audio analysis with a weighted multimodal fusion strategy to produce an overall deception-support assessment.

---

## Key Features

* 🎥 **Video Analysis Pipeline**

  * Facial landmark extraction using MediaPipe Face Landmarker
  * Temporal modeling of facial behavior using a Bidirectional LSTM (BiLSTM)
  * Detection of behavioral changes across interview segments

* 🎙️ **Audio Analysis Pipeline**

  * Speech feature extraction using Librosa
  * Acoustic analysis based on MFCCs, pitch, energy, spectral features, and related descriptors
  * Temporal sequence modeling using a Bidirectional LSTM (BiLSTM)

* 🔀 **Multimodal Fusion**

  * Independent audio and video predictions combined through weighted late fusion
  * Timestamp-based alignment between modalities for segment-level analysis

* 📊 **Explainable Timeline Output**

  * Segment-wise risk visualization
  * Supports reviewer interpretation instead of providing black-box predictions

* 🌐 **Full-Stack Integration**

  * FastAPI backend
  * React frontend dashboard
  * PostgreSQL database for storing analyses and historical results

---

## System Architecture

```
Interview Video
        │
        ▼
 ┌───────────────────┐
 │  Pre-processing   │
 │  • Frame Sampling │
 │  • Audio Extract  │
 └─────────┬─────────┘
           │
 ┌─────────┴─────────┐
 │                   │
 ▼                   ▼
Video Pipeline    Audio Pipeline
(MediaPipe +      (Librosa +
BiLSTM)           BiLSTM)
 │                   │
 └─────────┬─────────┘
           ▼
   Weighted Late Fusion
           │
           ▼
 Explainable Timeline &
 Overall Risk Assessment
           │
           ▼
   React Dashboard UI
```

---

## Technologies Used

### Machine Learning

* Python
* TensorFlow / Keras
* Bidirectional LSTM (BiLSTM)
* MediaPipe Face Landmarker
* OpenCV
* Librosa
* NumPy
* Scikit-learn

### Backend

* FastAPI
* REST API Architecture
* FFmpeg

### Frontend

* React
* Tailwind CSS

### Database

* PostgreSQL

---

## Data Processing Pipeline

### Video Pipeline

1. Load interview video
2. Sample frames at 5 FPS
3. Extract 478 facial landmarks per frame using MediaPipe
4. Normalize landmark coordinates
5. Construct temporal sequences
6. Generate predictions using a BiLSTM model

### Audio Pipeline

1. Extract audio from the interview video
2. Convert to mono WAV (16 kHz)
3. Segment into overlapping windows
4. Extract acoustic features including:

   * MFCC
   * Delta MFCC
   * Delta-Delta MFCC
   * RMS Energy
   * Zero Crossing Rate
   * Spectral Centroid
   * Spectral Bandwidth
   * Spectral Rolloff
   * Pitch
   * Voicing Probability
5. Apply feature scaling
6. Generate predictions using a BiLSTM model

### Fusion

* Match audio and video windows based on timestamp overlap
* Combine modality outputs using weighted late fusion
* Produce overall and segment-level deception-support scores

---

## Explainability

The system is intentionally designed as a **human decision-support tool**.

It does **not** claim to determine whether a person is truthful or deceptive. Instead, it identifies interview segments exhibiting behavioral inconsistencies and presents them through an explainable timeline to assist reviewers in conducting further analysis.

---

## Research Motivation

Traditional deception detection approaches often rely on subjective human judgment or invasive physiological measurements. This project explores a multimodal AI approach that combines facial and vocal behavioral analysis while emphasizing transparency and human oversight.

---

## Disclaimer

This project was developed for research and educational purposes.

Its outputs should **not** be interpreted as definitive evidence of deception or used as the sole basis for employment or other high-stakes decisions. Human judgment and contextual evaluation remain essential.

---

## Author

**Brian Fernando**
BSc (Hons) Software Engineering
University of Plymouth
