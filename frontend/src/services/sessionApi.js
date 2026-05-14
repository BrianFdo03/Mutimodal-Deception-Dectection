import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function getSessions() {
  const response = await axios.get(`${API_BASE_URL}/sessions/`);
  return response.data;
}

export async function getSessionById(sessionId) {
  const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}`);
  return response.data;
}

export async function createSession(sessionData) {
  const response = await axios.post(`${API_BASE_URL}/sessions/`, sessionData);
  return response.data;
}

export async function updateSession(sessionId, sessionData) {
  const response = await axios.patch(
    `${API_BASE_URL}/sessions/${sessionId}`,
    sessionData,
  );

  return response.data;
}

export async function markSessionConsentGiven(sessionId) {
  const response = await axios.patch(
    `${API_BASE_URL}/sessions/${sessionId}/consent`,
  );
  return response.data;
}

export async function deleteSessionById(sessionId) {
  const response = await axios.delete(`${API_BASE_URL}/sessions/${sessionId}`);
  return response.data;
}
