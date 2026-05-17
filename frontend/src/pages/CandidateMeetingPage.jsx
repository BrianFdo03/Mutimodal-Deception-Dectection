import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MonitorPlay,
  ShieldCheck,
  UserRound,
  Video,
} from "lucide-react";

import { getCandidateSessionAccess } from "../services/sessionApi";

import JitsiMeetingFrame from "../components/JitsiMeetingFrame";

export default function CandidateMeetingPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCandidateSession();
  }, [sessionId, token]);

  async function loadCandidateSession() {
    if (!token) {
      setErrorMessage(
        "Candidate access token is missing from the meeting link.",
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getCandidateSessionAccess(sessionId, token);

      if (!response.success) {
        throw new Error("Could not validate candidate meeting link.");
      }

      setSession(response.data);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "This candidate meeting link is invalid or expired.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <CandidateMeetingShell>
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">Loading candidate meeting room...</p>
        </div>
      </CandidateMeetingShell>
    );
  }

  if (errorMessage && !session) {
    return (
      <CandidateMeetingShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
          <h1 className="text-xl font-bold text-red-900">
            Unable to Open Meeting
          </h1>
          <p className="mt-2 text-sm leading-6">{errorMessage}</p>
        </div>
      </CandidateMeetingShell>
    );
  }

  const consentGiven = session?.consent_status === "Given";

  if (!consentGiven) {
    return (
      <CandidateMeetingShell>
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="rounded-2xl bg-yellow-100 p-4 text-yellow-800">
              <AlertTriangle size={32} />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-yellow-950">
                Consent Required Before Joining
              </h1>

              <p className="mt-3 leading-7 text-yellow-900">
                You need to submit the interview recording and analysis consent
                form before joining this meeting.
              </p>

              <div className="mt-6 rounded-2xl bg-white/70 p-5">
                <InfoRow label="Candidate" value={session?.candidate_name} />
                <InfoRow label="Stage" value={session?.stage} />
                <InfoRow label="Date" value={session?.session_date} />
                <InfoRow label="Time" value={session?.session_time} />
              </div>

              <button
                onClick={() =>
                  navigate(`/candidate-consent/${sessionId}?token=${token}`)
                }
                className="mt-6 rounded-xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white hover:bg-yellow-800"
              >
                Open Consent Form
              </button>
            </div>
          </div>
        </div>
      </CandidateMeetingShell>
    );
  }

  return (
    <CandidateMeetingShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Candidate Meeting
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Virtual Interview Waiting Room
        </h1>

        <p className="mt-3 max-w-3xl text-gray-600">
          Your consent has been confirmed. Please wait here until the
          interviewer starts the session.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                <CheckCircle2 size={26} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Consent Confirmed
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  You have already given consent for this interview session. The
                  interviewer may record the meeting and use the recording for
                  behavioral inconsistency review.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
            <p className="font-semibold text-blue-950">Waiting room note</p>
            <p className="mt-2 leading-6">
              If the meeting has not started yet, please wait until the
              interviewer joins and starts the session.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="overflow-hidden rounded-3xl bg-gray-950">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-950">
                    Live Interview Room
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Join the video meeting below. Please keep your camera
                    enabled and remain clearly visible during the interview.
                  </p>
                </div>

                <JitsiMeetingFrame
                  roomName={session?.meeting_room_name}
                  displayName={session?.candidate_name || "Candidate"}
                  role="candidate"
                  height={620}
                />
              </div>
            </div>

            {/* <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <MonitorPlay className="mt-0.5 text-blue-700" size={22} />

                <div>
                  <h3 className="font-semibold text-blue-950">
                    Meeting integration pending
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    This page is ready for the Jitsi meeting iframe. In the next
                    step, this waiting room area will be replaced with the live
                    video meeting interface.
                  </p>
                </div>
              </div>
            </div> */}
          </div>

          <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-yellow-700" size={22} />

              <div>
                <h2 className="text-lg font-bold text-yellow-950">
                  Interview reminder
                </h2>

                <p className="mt-2 text-sm leading-6 text-yellow-800">
                  This system is used as a decision-support tool. It does not
                  make final hiring decisions and does not prove deception.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <CalendarDays size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Interview Details
                </h2>
                <p className="text-sm text-gray-500">Session information</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <InfoRow label="Candidate" value={session?.candidate_name} />
              <InfoRow label="Stage" value={session?.stage} />
              <InfoRow label="Date" value={session?.session_date} />
              <InfoRow label="Time" value={session?.session_time} />
              <InfoRow label="Mode" value={session?.meeting_mode} />
              <InfoRow label="Consent" value={session?.consent_status} />
              <InfoRow label="Status" value={session?.session_status} />
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Before Joining
                </h2>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-6 text-gray-600">
              <li>• Sit in a well-lit environment.</li>
              <li>• Keep your face clearly visible.</li>
              <li>• Use a stable internet connection.</li>
              <li>• Avoid switching tabs unnecessarily.</li>
              <li>• Wait for the interviewer to begin.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <button
              onClick={loadCandidateSession}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Video size={18} />
              Refresh Meeting Status
            </button>
          </section>
        </aside>
      </div>
    </CandidateMeetingShell>
  );
}

function CandidateMeetingShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-bold text-gray-950">recruitAI</h1>
            <p className="text-xs text-gray-500">
              Interview Integrity Assistant
            </p>
          </div>

          <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
            Candidate Portal
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0">
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
