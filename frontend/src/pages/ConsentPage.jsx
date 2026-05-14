import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { getSessionById, updateSession } from "../services/localDataService";

export default function ConsentPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [hasReadNotice, setHasReadNotice] = useState(false);
  const [agreesToRecording, setAgreesToRecording] = useState(false);
  const [agreesToAnalysis, setAgreesToAnalysis] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const foundSession = getSessionById(sessionId);

    if (!foundSession) {
      setErrorMessage("Interview session was not found.");
      return;
    }

    setSession(foundSession);
  }, [sessionId]);

  function handleConsentSubmit(event) {
    event.preventDefault();

    if (!hasReadNotice || !agreesToRecording || !agreesToAnalysis) {
      setErrorMessage(
        "Please confirm all consent statements before continuing.",
      );
      return;
    }

    updateSession(sessionId, {
      consentStatus: "Given",
      sessionStatus: "Ready",
      consentGivenAt: new Date().toISOString(),
    });

    navigate("/sessions");
  }

  if (errorMessage && !session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading consent form...
        </div>
      </div>
    );
  }

  const alreadyConsented = session.consentStatus === "Given";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">
          Candidate Consent Form
        </h1>

        <p className="mt-2 max-w-3xl text-gray-600">
          This form confirms candidate consent before recording and behavioral
          inconsistency analysis begins.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <FileText size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Consent Notice
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This interview session may be recorded and analyzed by the
                  system to identify behavioral inconsistency patterns during
                  the interview. The analysis is intended to support human
                  interviewer review and does not make automatic hiring
                  decisions.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-blue-700" size={22} />
                <div>
                  <h3 className="font-semibold text-blue-950">
                    Data and privacy statement
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    The system may store analysis results such as risk scores,
                    timeline segments, and explanation outputs. The original
                    video should only be retained for the required review period
                    and may be removed according to the organization&apos;s data
                    retention policy.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-yellow-700" size={22} />
                <div>
                  <h3 className="font-semibold text-yellow-950">
                    Important limitation
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-yellow-800">
                    The system does not prove deception. It highlights
                    behavioral patterns that may require human review. Final
                    decisions must remain with qualified interviewers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {alreadyConsented ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-green-700" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-green-950">
                    Consent Already Given
                  </h2>
                  <p className="mt-2 text-sm text-green-800">
                    This session has already received candidate consent.
                  </p>

                  <button
                    onClick={() => navigate("/sessions")}
                    className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    Back to Sessions
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleConsentSubmit}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-gray-950">
                Candidate Confirmation
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Please confirm each statement before continuing.
              </p>

              {errorMessage && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <ConsentCheckbox
                  checked={hasReadNotice}
                  onChange={setHasReadNotice}
                  label="I have read and understood the consent notice."
                />

                <ConsentCheckbox
                  checked={agreesToRecording}
                  onChange={setAgreesToRecording}
                  label="I agree that this interview session may be recorded for review purposes."
                />

                <ConsentCheckbox
                  checked={agreesToAnalysis}
                  onChange={setAgreesToAnalysis}
                  label="I agree that the recorded interview may be analyzed for behavioral inconsistency review."
                />
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/sessions")}
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Submit Consent
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Session Details
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <InfoRow label="Session ID" value={`#${session.id}`} />
              <InfoRow label="Candidate" value={session.candidateName} />
              <InfoRow label="Stage" value={session.stage} />
              <InfoRow label="Date" value={session.date} />
              <InfoRow label="Time" value={session.time} />
              <InfoRow label="Mode" value={session.meetingMode} />
              <InfoRow label="Consent" value={session.consentStatus} />
              <InfoRow label="Status" value={session.sessionStatus} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Demo Assumption
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              This demo assumes one interviewer and one candidate per session.
              Multi-participant interviews can be added later after the basic
              workflow is stable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span className="text-sm leading-6 text-gray-700">{label}</span>
    </label>
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
