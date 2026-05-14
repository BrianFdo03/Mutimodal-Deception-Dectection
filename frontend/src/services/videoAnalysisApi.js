import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeVideo(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_BASE_URL}/video-analysis/analyze`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function getVideoAnalysisById(analysisId) {
  const response = await axios.get(
    `${API_BASE_URL}/video-analysis/${analysisId}`,
  );

  return response.data;
}

export async function getVideoAnalysisHistory() {
  const response = await axios.get(
    `${API_BASE_URL}/video-analysis/history/all`,
  );

  return response.data;
}

export async function deleteVideoAnalysisById(analysisId) {
  const response = await axios.delete(
    `${API_BASE_URL}/video-analysis/${analysisId}`,
  );

  return response.data;
}
