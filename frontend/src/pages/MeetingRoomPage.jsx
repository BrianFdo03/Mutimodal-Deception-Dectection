import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Mic,
  MonitorUp,
  PhoneOff,
  PlayCircle,
  UserRound,
  Video,
} from "lucide-react";

import { getSessionById, updateSession } from "../services/localDataService";

export default function MeetingRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState("");

  useEffect(() => {
    const foundSession = getSessionById(sessionId);

    if (!foundSession) {
      setErrorMessage("Interview session was not found.");
      return;
    }

    setSession(foundSession);
    setInterviewNotes(foundSession.meetingNotes || "");
    setMeetingEnded(foundSession.sessionStatus === "Completed");
  }, [sessionId]);

  function startMeeting() {
    setMeetingStarted(true);

    updateSession(sessionId, {
      sessionStatus: "In Progress",
    });

    setSession((currentSession) => ({
      ...currentSession,
      sessionStatus: "In Progress",
    }));
  }

  function saveNotes() {
    updateSession(sessionId, {
      meetingNotes: interviewNotes,
    });

    alert("Interview notes saved.");
  }

  function endMeeting() {
    const confirmed = window.confirm(
      "Are you sure you want to end this interview session?",
    );

    if (!confirmed) {
      return;
    }

    updateSession(sessionId, {
      sessionStatus: "Completed",
      analysisStatus: "Ready for Analysis",
      meetingNotes: interviewNotes,
      completedAt: new Date().toISOString(),
    });

    setMeetingEnded(true);

    setSession((currentSession) => ({
      ...currentSession,
      sessionStatus: "Completed",
      analysisStatus: "Ready for Analysis",
      meetingNotes: interviewNotes,
      completedAt: new Date().toISOString(),
    }));
  }

  if (errorMessage) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading meeting room...
        </div>
      </div>
    );
  }

  const consentGiven = session.consentStatus === "Given";

  if (!consentGiven) {
    return <ConsentRequiredView session={session} navigate={navigate} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">
            Online Interview Room
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            One-to-one interview session between one interviewer and one
            candidate. This demo room prepares the workflow for future live
            conferencing or recording.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/sessions")}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Sessions
          </button>

          <button
            onClick={() => navigate("/analyze-video")}
            className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Analyze Recording
          </button>
        </div>
      </div>

      {meetingEnded && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5" />
            <div>
              <p className="font-semibold">Interview completed</p>
              <p className="mt-1 text-sm">
                This session is ready for video analysis. Use the Analyze
                Recording button to upload the recorded interview file.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <VideoPanel
                title={session.candidateName}
                subtitle="Candidate / Interviewee"
                initials={getInitials(session.candidateName)}
                isActive={meetingStarted && !meetingEnded}
              />

              <VideoPanel
                title="Demo Interviewer"
                subtitle="HR Evaluator"
                initials="DI"
                isActive={meetingStarted && !meetingEnded}
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!meetingStarted && !meetingEnded && (
                <button
                  onClick={startMeeting}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                >
                  <PlayCircle size={18} />
                  Start Interview
                </button>
              )}

              <MeetingButton
                icon={Mic}
                label="Mute"
                disabled={!meetingStarted || meetingEnded}
              />
              <MeetingButton
                icon={Video}
                label="Camera"
                disabled={!meetingStarted || meetingEnded}
              />
              <MeetingButton
                icon={MonitorUp}
                label="Share"
                disabled={!meetingStarted || meetingEnded}
              />

              {!meetingEnded && (
                <button
                  onClick={endMeeting}
                  disabled={!meetingStarted}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                    meetingStarted
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <PhoneOff size={18} />
                  End Interview
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <ClipboardList size={22} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-950">
                  Interview Notes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add notes during the interview. These notes are stored locally
                  for the demo workflow.
                </p>

                <textarea
                  value={interviewNotes}
                  onChange={(event) => setInterviewNotes(event.target.value)}
                  rows="6"
                  className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                  placeholder="Write interviewer notes here..."
                />

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveNotes}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>

          <InterviewGuide />
        </div>

        <div className="space-y-6">
          <SessionInfoCard session={session} />

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-lg font-semibold text-blue-950">
              Demo Meeting Limitation
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              This is a product workflow screen. Full live video conferencing
              can be implemented later using WebRTC, Jitsi, Daily, or another
              meeting SDK. For now, recorded videos are uploaded to the existing
              analysis pipeline.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-6">
            <h2 className="text-lg font-semibold text-yellow-950">
              Analysis Reminder
            </h2>
            <p className="mt-2 text-sm leading-6 text-yellow-800">
              After ending the interview, upload the recorded session video
              using the analysis page to generate the behavioral inconsistency
              timeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRequiredView({ session, navigate }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="rounded-2xl bg-yellow-100 p-4 text-yellow-800">
            <AlertTriangle size={32} />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-yellow-950">
              Candidate Consent Required
            </h1>

            <p className="mt-3 leading-7 text-yellow-900">
              This interview session cannot be opened until the candidate has
              provided consent for recording and behavioral inconsistency
              analysis.
            </p>

            <div className="mt-6 rounded-2xl bg-white/70 p-5">
              <p className="text-sm text-yellow-900">
                <span className="font-semibold">Session:</span> #{session.id}
              </p>
              <p className="mt-2 text-sm text-yellow-900">
                <span className="font-semibold">Candidate:</span>{" "}
                {session.candidateName}
              </p>
              <p className="mt-2 text-sm text-yellow-900">
                <span className="font-semibold">Stage:</span> {session.stage}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/consent/${session.id}`)}
                className="rounded-xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white hover:bg-yellow-800"
              >
                Open Consent Form
              </button>

              <button
                onClick={() => navigate("/sessions")}
                className="rounded-xl border border-yellow-300 bg-white px-5 py-3 text-sm font-semibold text-yellow-900 hover:bg-yellow-100"
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoPanel({ title, subtitle, initials, isActive }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gray-950">
      <div className="relative flex h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-gray-950">
            {initials}
          </div>

          <p className="mt-4 font-semibold text-white">{title}</p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>

        <div className="absolute left-4 top-4">
          {isActive ? (
            <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
              Live
            </span>
          ) : (
            <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-200">
              Waiting
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingButton({ icon: Icon, label, disabled }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold ${
        disabled
          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function SessionInfoCard({ session }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          <CalendarDays size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            Session Details
          </h2>
          <p className="text-sm text-gray-500">Interview session metadata</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <InfoRow label="Session ID" value={`#${session.id}`} />
        <InfoRow label="Candidate" value={session.candidateName} />
        <InfoRow label="Stage" value={session.stage} />
        <InfoRow label="Date" value={session.date} />
        <InfoRow label="Time" value={session.time} />
        <InfoRow label="Mode" value={session.meetingMode} />
        <InfoRow label="Consent" value={session.consentStatus} />
        <InfoRow label="Status" value={session.sessionStatus} />
        <InfoRow label="Analysis" value={session.analysisStatus} />
      </div>
    </div>
  );
}

function InterviewGuide() {
  const questions = [
    "Can you briefly introduce yourself and your background?",
    "Can you explain a project where you solved a difficult technical problem?",
    "What specific responsibilities did you handle in your previous role?",
    "Can you describe a situation where you worked under pressure?",
    "Is there anything in your resume you would like to clarify?",
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-950">Interview Guide</h2>
      <p className="mt-1 text-sm text-gray-500">
        Suggested questions for the interviewer during the session.
      </p>

      <div className="mt-5 space-y-3">
        {questions.map((question, index) => (
          <div
            key={question}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <p className="text-sm font-semibold text-gray-500">
              Question {index + 1}
            </p>
            <p className="mt-1 text-sm text-gray-800">{question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-950">
        {value || "N/A"}
      </span>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
