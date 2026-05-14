import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function getCandidates() {
  const response = await axios.get(`${API_BASE_URL}/candidates/`);
  return response.data;
}

export async function getCandidateById(candidateId) {
  const response = await axios.get(`${API_BASE_URL}/candidates/${candidateId}`);
  return response.data;
}

export async function createCandidate(candidateData) {
  const response = await axios.post(
    `${API_BASE_URL}/candidates/`,
    candidateData,
  );
  return response.data;
}

export async function updateCandidate(candidateId, candidateData) {
  const response = await axios.patch(
    `${API_BASE_URL}/candidates/${candidateId}`,
    candidateData,
  );

  return response.data;
}

export async function deleteCandidateById(candidateId) {
  const response = await axios.delete(
    `${API_BASE_URL}/candidates/${candidateId}`,
  );
  return response.data;
}
