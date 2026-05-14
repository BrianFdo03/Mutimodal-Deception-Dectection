const CANDIDATES_KEY = "veriview_candidates";
const SESSIONS_KEY = "veriview_sessions";

function readFromStorage(key, fallbackValue = []) {
  try {
    const rawData = localStorage.getItem(key);

    if (!rawData) {
      return fallbackValue;
    }

    return JSON.parse(rawData);
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage`, error);
    return fallbackValue;
  }
}

function writeToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* -------------------- Candidates -------------------- */

export function getCandidates() {
  return readFromStorage(CANDIDATES_KEY, []);
}

export function saveCandidate(candidateData) {
  const candidates = getCandidates();

  const newCandidate = {
    id: Date.now(),
    name: candidateData.name,
    email: candidateData.email,
    phone: candidateData.phone || "",
    position: candidateData.position,
    experienceLevel: candidateData.experienceLevel || "Entry Level",
    status: candidateData.status || "New",
    notes: candidateData.notes || "",
    createdAt: new Date().toISOString(),
  };

  const updatedCandidates = [newCandidate, ...candidates];

  writeToStorage(CANDIDATES_KEY, updatedCandidates);

  return newCandidate;
}

export function getCandidateById(candidateId) {
  const candidates = getCandidates();

  return candidates.find(
    (candidate) => String(candidate.id) === String(candidateId),
  );
}

export function deleteCandidate(candidateId) {
  const candidates = getCandidates();

  const updatedCandidates = candidates.filter(
    (candidate) => String(candidate.id) !== String(candidateId),
  );

  writeToStorage(CANDIDATES_KEY, updatedCandidates);

  return updatedCandidates;
}

/* -------------------- Sessions -------------------- */

export function getSessions() {
  return readFromStorage(SESSIONS_KEY, []);
}

export function saveSession(sessionData) {
  const sessions = getSessions();

  const candidate = getCandidateById(sessionData.candidateId);

  const newSession = {
    id: Date.now(),
    candidateId: sessionData.candidateId,
    candidateName: candidate?.name || "Unknown Candidate",
    stage: sessionData.stage,
    date: sessionData.date,
    time: sessionData.time,
    meetingMode: sessionData.meetingMode || "Online",
    consentStatus: "Pending",
    sessionStatus: "Scheduled",
    analysisStatus: "Not Started",
    notes: sessionData.notes || "",
    createdAt: new Date().toISOString(),
  };

  const updatedSessions = [newSession, ...sessions];

  writeToStorage(SESSIONS_KEY, updatedSessions);

  return newSession;
}

export function getSessionById(sessionId) {
  const sessions = getSessions();

  return sessions.find((session) => String(session.id) === String(sessionId));
}

export function updateSession(sessionId, updates) {
  const sessions = getSessions();

  const updatedSessions = sessions.map((session) => {
    if (String(session.id) !== String(sessionId)) {
      return session;
    }

    return {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });

  writeToStorage(SESSIONS_KEY, updatedSessions);

  return getSessionById(sessionId);
}

export function deleteSession(sessionId) {
  const sessions = getSessions();

  const updatedSessions = sessions.filter(
    (session) => String(session.id) !== String(sessionId),
  );

  writeToStorage(SESSIONS_KEY, updatedSessions);

  return updatedSessions;
}
