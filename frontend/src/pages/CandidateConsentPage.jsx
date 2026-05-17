import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

import {
  getCandidateSessionAccess,
  submitCandidateConsent,
} from "../services/sessionApi";

export default function CandidateConsentPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasReadNotice, setHasReadNotice] = useState(false);
  const [agreesToRecording, setAgreesToRecording] = useState(false);
  const [agreesToAnalysis, setAgreesToAnalysis] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCandidateSession();
  }, [sessionId, token]);

  async function loadCandidateSession() {
    if (!token) {
      setErrorMessage("Candidate access token is missing from the link.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getCandidateSessionAccess(sessionId, token);

      if (!response.success) {
        throw new Error("Could not validate candidate session link.");
      }

      setSession(response.data);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "This candidate session link is invalid or expired.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitConsent(event) {
    event.preventDefault();

    if (!hasReadNotice || !agreesToRecording || !agreesToAnalysis) {
      setErrorMessage(
        "Please confirm all consent statements before continuing.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await submitCandidateConsent(sessionId, token);

      if (!response.success) {
        throw new Error("Could not submit candidate consent.");
      }

      setSession(response.data);

      navigate(`/candidate-meeting/${sessionId}?token=${token}`);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while submitting consent.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <CandidatePageShell>
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">Loading candidate consent form...</p>
        </div>
      </CandidatePageShell>
    );
  }

  if (errorMessage && !session) {
    return (
      <CandidatePageShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
          <h1 className="text-xl font-bold text-red-900">
            Unable to Open Consent Form
          </h1>
          <p className="mt-2 text-sm leading-6">{errorMessage}</p>
        </div>
      </CandidatePageShell>
    );
  }

  const alreadyConsented = session?.consent_status === "Given";

  return (
    <CandidatePageShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Candidate Consent
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Interview Recording & Analysis Consent
        </h1>

        <p className="mt-3 max-w-3xl text-gray-600">
          Please review the information below before joining your virtual
          interview. Consent is required before recording or behavioral
          inconsistency analysis can begin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gray-100 p-3 text-gray-700">
                <FileText size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Consent Notice
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  This interview session may be recorded and analyzed by the
                  system to identify behavioral inconsistency patterns during
                  the interview. The analysis is intended to support interviewer
                  review and does not make automatic hiring decisions.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-blue-700" size={22} />

                <div>
                  <h3 className="font-semibold text-blue-950">
                    Privacy and data use
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    The system may store analysis outputs such as timeline
                    segments, risk scores, and explanation notes. Interview
                    recordings and analysis outputs should only be retained for
                    the required review period.
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
                    This system does not prove deception. It highlights
                    behavioral patterns that may require human review. Final
                    decisions remain with qualified interviewers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {alreadyConsented ? (
            <section className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-green-700" size={24} />

                <div>
                  <h2 className="text-lg font-bold text-green-950">
                    Consent Already Submitted
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-green-800">
                    Your consent has already been recorded for this interview
                    session. You may continue to the candidate meeting page.
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/candidate-meeting/${sessionId}?token=${token}`)
                    }
                    className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    Continue to Meeting
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <form
              onSubmit={handleSubmitConsent}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-gray-950">
                Candidate Confirmation
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Confirm each statement before continuing.
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
                  onClick={() =>
                    navigate(`/candidate-meeting/${sessionId}?token=${token}`)
                  }
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Go to Meeting
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${
                    isSubmitting
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-gray-950 hover:bg-gray-800"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Consent"}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Interview Details
            </h2>

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
            <h2 className="text-lg font-semibold text-gray-950">
              What happens next?
            </h2>

            <ol className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              <li>1. Submit consent after reading the notice.</li>
              <li>2. Continue to the candidate meeting page.</li>
              <li>3. Join the interview at the scheduled time.</li>
              <li>4. The interviewer may start analysis after recording.</li>
            </ol>
          </section>
        </aside>
      </div>
    </CandidatePageShell>
  );
}

function CandidatePageShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-bold text-gray-950">RecruitAI</h1>
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
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-950">
        {value || "N/A"}
      </span>
    </div>
  );
}
