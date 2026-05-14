import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  MonitorPlay,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

// import {
//   deleteSession,
//   getCandidates,
//   getSessions,
//   saveSession,
//   updateSession,
// } from "../services/localDataService";

import { getCandidates } from "../services/candidateApi";
import {
  createSession,
  deleteSessionById,
  getSessions,
} from "../services/sessionApi";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadPageData();
  }, []);

  // function loadPageData() {
  //   setSessions(getSessions());
  //   setCandidates(getCandidates());
  // }

  async function loadPageData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [sessionsResponse, candidatesResponse] = await Promise.all([
        getSessions(),
        getCandidates(),
      ]);

      setSessions(sessionsResponse.data || []);
      setCandidates(candidatesResponse || []);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while loading sessions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const searchableText = [
        session.candidate_name,
        session.stage,
        session.session_date,
        session.session_time,
        session.consent_status,
        session.session_status,
        session.analysis_status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchText.toLowerCase());
    });
  }, [sessions, searchText]);

  function handleSessionCreated() {
    loadPageData();
    setIsFormOpen(false);
  }

  async function handleDeleteSession(sessionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview session?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      await deleteSessionById(sessionId);

      setSessions((currentSessions) =>
        currentSessions.filter(
          (session) => String(session.session_id) !== String(sessionId),
        ),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while deleting the session.",
      );
    }
  }

  async function handleDeleteSession(sessionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview session?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      await deleteSessionById(sessionId);

      setSessions((currentSessions) =>
        currentSessions.filter(
          (session) => String(session.session_id) !== String(sessionId),
        ),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while deleting the session.",
      );
    }
  }
  // async function handleDeleteSession(sessionId) {
  //   const confirmed = window.confirm(
  //     "Are you sure you want to delete this interview session?",
  //   );

  //   if (!confirmed) {
  //     return;
  //   }

  //   const updatedSessions = deleteSessionById(sessionId);
  //   setSessions(updatedSessions);
  // }

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard.`);
    } catch (error) {
      console.error(error);
      alert("Could not copy link. Please copy it manually.");
    }
  }

  function getActionButtonClass(type = "default") {
    const baseClass =
      "inline-flex h-9 min-w-[92px] items-center justify-center gap-1 rounded-lg border px-3 text-xs font-semibold transition";

    const styles = {
      default: "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
      primary: "border-gray-900 bg-gray-900 text-white hover:bg-gray-800",
      success: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
      info: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
      purple:
        "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
      indigo:
        "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
      danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    };

    return `${baseClass} ${styles[type] || styles.default}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">
            Interview Sessions
          </h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Schedule and monitor one-to-one virtual interview sessions. Each
            demo session contains one interviewer and one candidate.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <MiniStatusCard title="Total Sessions" value={sessions.length} />
        <MiniStatusCard
          title="Consent Pending"
          value={
            sessions.filter((session) => session.consent_status === "Pending")
              .length
          }
        />
        <MiniStatusCard
          title="Ready"
          value={
            sessions.filter((session) => session.session_status === "Ready")
              .length
          }
        />
        <MiniStatusCard
          title="Completed"
          value={
            sessions.filter((session) => session.session_status === "Completed")
              .length
          }
        />
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search sessions by candidate, stage, date, or status"
            className="w-full text-sm outline-none"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-950">
            Session Records
          </h2>
          <p className="text-sm text-gray-500">
            Showing {filteredSessions.length} of {sessions.length} scheduled
            sessions.
          </p>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-500">
            Loading interview sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No sessions found. Schedule an interview session to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="px-6 py-3">Session</th>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Stage</th>
                  <th className="px-6 py-3">Date / Time</th>
                  <th className="px-6 py-3">Consent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Analysis</th>
                  <th className="px-6 py-3 min-w-[300px]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((session) => (
                  <tr
                    key={session.session_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-950">
                      #{session.session_id}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {session.candidate_name || "N/A"}
                    </td>

                    <td className="px-6 py-4 text-gray-700">{session.stage}</td>

                    <td className="px-6 py-4 text-gray-700">
                      {session.session_date} · {session.session_time}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        label={session.consent_status}
                        type={
                          session.consent_status === "Given"
                            ? "success"
                            : "warning"
                        }
                      />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        label={session.session_status}
                        type={
                          session.session_status === "Completed"
                            ? "success"
                            : session.session_status === "Ready"
                              ? "info"
                              : "warning"
                        }
                      />
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {session.analysis_status}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex min-w-[280px] flex-col gap-2">
                        {/* Primary workflow actions */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              navigate(`/meeting/${session.session_id}`)
                            }
                            className={getActionButtonClass("primary")}
                          >
                            <MonitorPlay size={14} />
                            Meeting
                          </button>

                          {session.consent_status !== "Given" ? (
                            <button
                              onClick={() =>
                                navigate(`/consent/${session.session_id}`)
                              }
                              className={getActionButtonClass("success")}
                            >
                              <CheckCircle2 size={14} />
                              Consent
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                navigate(`/consent/${session.session_id}`)
                              }
                              className={getActionButtonClass("default")}
                            >
                              <CheckCircle2 size={14} />
                              View Consent
                            </button>
                          )}
                        </div>

                        {/* Secondary actions */}
                        <div className="flex flex-wrap gap-2">
                          {session.candidate_consent_url && (
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  session.candidate_consent_url,
                                  "Candidate consent link",
                                )
                              }
                              className={getActionButtonClass("purple")}
                            >
                              Copy Consent
                            </button>
                          )}

                          {session.candidate_meeting_url && (
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  session.candidate_meeting_url,
                                  "Candidate meeting link",
                                )
                              }
                              className={getActionButtonClass("indigo")}
                            >
                              Copy Meeting
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleDeleteSession(session.session_id)
                            }
                            className={getActionButtonClass("danger")}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <SessionFormModal
          candidates={candidates}
          onClose={() => setIsFormOpen(false)}
          onCreated={handleSessionCreated}
        />
      )}
    </div>
  );
}

function SessionFormModal({ candidates, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    candidateId: candidates[0]?.candidate_id || "",
    stage: "Technical Interview",
    date: "",
    time: "",
    meetingMode: "Online",
    notes: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.candidateId) {
      setErrorMessage("Please select a candidate.");
      return;
    }

    if (!formData.date) {
      setErrorMessage("Please select a session date.");
      return;
    }

    if (!formData.time) {
      setErrorMessage("Please select a session time.");
      return;
    }

    try {
      setErrorMessage("");

      await createSession({
        candidate_id: Number(formData.candidateId),
        stage: formData.stage,
        session_date: formData.date,
        session_time: formData.time,
        meeting_mode: formData.meetingMode,
        notes: formData.notes,
      });

      onCreated();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while scheduling the session.",
      );
    }
  }

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard.`);
    } catch (error) {
      console.error(error);
      alert("Could not copy link. Please copy it manually.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Schedule Interview Session
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a one-to-one interview session for one candidate and one
              interviewer.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            No candidates are available. Please add a candidate before
            scheduling a session.
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Candidate
                </label>
                <select
                  value={formData.candidateId}
                  onChange={(event) =>
                    updateField("candidateId", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                >
                  {candidates.map((candidate) => (
                    <option
                      key={candidate.candidate_id}
                      value={candidate.candidate_id}
                    >
                      {candidate.name} — {candidate.position}
                    </option>
                  ))}
                </select>
              </div>

              <SelectField
                label="Interview Stage"
                value={formData.stage}
                onChange={(value) => updateField("stage", value)}
                options={[
                  "Screening Interview",
                  "Technical Interview",
                  "HR Interview",
                  "Final Interview",
                ]}
              />

              <SelectField
                label="Meeting Mode"
                value={formData.meetingMode}
                onChange={(value) => updateField("meetingMode", value)}
                options={["Online", "Recorded Upload"]}
              />

              <FormField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(value) => updateField("date", value)}
              />

              <FormField
                label="Time"
                type="time"
                value={formData.time}
                onChange={(value) => updateField("time", value)}
              />

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows="3"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                  placeholder="Optional interview notes..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Save Session
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStatusCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-950">{value}</h3>
    </div>
  );
}

function StatusBadge({ label, type }) {
  let classes = "border-gray-200 bg-gray-100 text-gray-700";

  if (type === "success") {
    classes = "border-green-200 bg-green-50 text-green-700";
  } else if (type === "warning") {
    classes = "border-yellow-200 bg-yellow-50 text-yellow-700";
  } else if (type === "info") {
    classes = "border-blue-200 bg-blue-50 text-blue-700";
  }

  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
