import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  FileText,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getVideoAnalysisById } from "../services/videoAnalysisApi";
import { getCandidateById, getSessions } from "../services/localDataService";

import RiskBadge from "../components/RiskBadge";

export default function ReportPreviewPage() {
  const { analysisId } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [linkedSession, setLinkedSession] = useState(null);
  const [linkedCandidate, setLinkedCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadReportData();
  }, [analysisId]);

  async function loadReportData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getVideoAnalysisById(analysisId);

      if (!response.success) {
        throw new Error("Could not load analysis report.");
      }

      const loadedAnalysis = response.data;
      setAnalysis(loadedAnalysis);

      const sessions = getSessions();

      const matchingSession = sessions.find(
        (session) =>
          String(session.linkedAnalysisId) ===
          String(loadedAnalysis.analysis_id),
      );

      if (matchingSession) {
        setLinkedSession(matchingSession);

        if (matchingSession.candidateId) {
          const candidate = getCandidateById(matchingSession.candidateId);
          setLinkedCandidate(candidate || null);
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while loading the report.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const reportStats = useMemo(() => {
    if (!analysis?.timeline) {
      return {
        totalSegments: 0,
        highRiskSegments: [],
        mediumRiskSegments: [],
        lowRiskSegments: [],
        reviewSegments: [],
      };
    }

    const highRiskSegments = analysis.timeline.filter(
      (segment) => segment.risk === "high",
    );

    const mediumRiskSegments = analysis.timeline.filter(
      (segment) => segment.risk === "medium",
    );

    const lowRiskSegments = analysis.timeline.filter(
      (segment) => segment.risk === "low",
    );

    return {
      totalSegments: analysis.timeline.length,
      highRiskSegments,
      mediumRiskSegments,
      lowRiskSegments,
      reviewSegments: [...highRiskSegments, ...mediumRiskSegments],
    };
  }, [analysis]);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading report preview...
        </div>
      </div>
    );
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

  if (!analysis) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Report data was not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <button
          onClick={() => navigate(`/saved-analysis?id=${analysis.analysis_id}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
          Back to Analysis
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Printer size={18} />
          Print / Save as PDF
        </button>
      </div>

      <article className="rounded-3xl border border-gray-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <ReportHeader analysis={analysis} />

        <div className="border-t border-gray-200 p-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Overall Risk"
              value={<RiskBadge risk={analysis.overall_risk} />}
            />

            <SummaryCard
              label="Overall Score"
              value={Number(analysis.overall_score || 0).toFixed(2)}
            />

            <SummaryCard
              label="High-Risk Segments"
              value={reportStats.highRiskSegments.length}
            />

            <SummaryCard
              label="Review Segments"
              value={reportStats.reviewSegments.length}
            />
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CandidateSessionCard
              candidate={linkedCandidate}
              session={linkedSession}
            />

            <AnalysisInfoCard analysis={analysis} />
          </section>

          <EthicalNotice />

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Flagged Segment Review
                </h2>
                <p className="text-sm text-gray-500">
                  High and medium-risk timeline windows requiring interviewer
                  review.
                </p>
              </div>
            </div>

            {reportStats.reviewSegments.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
                No medium or high-risk segments were flagged in this analysis.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                      <th className="px-5 py-3">Time Range</th>
                      <th className="px-5 py-3">Risk</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">XAI Explanation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportStats.reviewSegments.map((segment) => (
                      <tr
                        key={segment.window_index}
                        className="border-b border-gray-100 align-top"
                      >
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          {Number(segment.start).toFixed(2)}s –{" "}
                          {Number(segment.end).toFixed(2)}s
                        </td>

                        <td className="px-5 py-4">
                          <RiskBadge risk={segment.risk} />
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-950">
                          {Number(
                            segment.smoothed_score ?? segment.raw_score ?? 0,
                          ).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          <p>
                            {segment.explanation?.detail ||
                              segment.explanation?.summary ||
                              "No explanation available for this segment."}
                          </p>

                          {segment.explanation?.main_factors?.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
                              {segment.explanation.main_factors.map(
                                (factor) => (
                                  <li key={factor}>{factor}</li>
                                ),
                              )}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <FileText size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Timeline Summary
                </h2>
                <p className="text-sm text-gray-500">
                  Distribution of detected risk levels across the analyzed
                  video.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TimelineStat
                label="Low Risk"
                value={reportStats.lowRiskSegments.length}
                description="Stable behavioral windows"
              />

              <TimelineStat
                label="Medium Risk"
                value={reportStats.mediumRiskSegments.length}
                description="Review-worthy windows"
              />

              <TimelineStat
                label="High Risk"
                value={reportStats.highRiskSegments.length}
                description="Priority review windows"
              />
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-bold text-gray-950">Reviewer Notes</h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {linkedSession?.meetingNotes ||
                "No reviewer notes were attached to this analysis."}
            </p>
          </section>

          <section className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs leading-6 text-gray-500">
              Generated by VeriView Interview Integrity Assistant. This report
              is intended for internal human review and should not be
              interpreted as proof of deception or used as the sole basis for
              hiring decisions.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

function ReportHeader({ analysis }) {
  return (
    <header className="p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-950 p-3 text-white">
              <ShieldCheck size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-950">
                Behavioral Integrity Report
              </h1>
              <p className="text-sm text-gray-500">
                Virtual interview behavioral inconsistency review
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-gray-600">
            This report summarizes video-based behavioral inconsistency
            analysis, timeline flags, and explainable AI outputs generated for
            interviewer review.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm">
          <InfoRow label="Analysis ID" value={`#${analysis.analysis_id}`} />
          <InfoRow label="Video" value={analysis.video_name} />
          <InfoRow label="Generated" value={new Date().toLocaleString()} />
        </div>
      </div>
    </header>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-3 text-2xl font-bold text-gray-950">{value}</div>
    </div>
  );
}

function CandidateSessionCard({ candidate, session }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          <UserRound size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-950">
            Candidate & Session Details
          </h2>
          <p className="text-sm text-gray-500">Linked local workflow data</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <InfoRow
          label="Candidate"
          value={candidate?.name || session?.candidateName || "N/A"}
        />
        <InfoRow label="Email" value={candidate?.email || "N/A"} />
        <InfoRow label="Position" value={candidate?.position || "N/A"} />
        <InfoRow label="Interview Stage" value={session?.stage || "N/A"} />
        <InfoRow label="Session Date" value={session?.date || "N/A"} />
        <InfoRow label="Session Time" value={session?.time || "N/A"} />
        <InfoRow
          label="Consent Status"
          value={session?.consentStatus || "N/A"}
        />
      </div>
    </section>
  );
}

function AnalysisInfoCard({ analysis }) {
  const metadata = analysis.metadata || {};

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          <CalendarDays size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-950">Analysis Details</h2>
          <p className="text-sm text-gray-500">
            Processing metadata and stored result details
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <InfoRow
          label="Created At"
          value={
            analysis.created_at
              ? new Date(analysis.created_at).toLocaleString()
              : "N/A"
          }
        />
        <InfoRow label="Original FPS" value={metadata.original_fps ?? "N/A"} />
        <InfoRow label="Target FPS" value={metadata.target_fps ?? "N/A"} />
        <InfoRow
          label="Duration"
          value={
            metadata.duration_seconds
              ? `${Number(metadata.duration_seconds).toFixed(2)}s`
              : "N/A"
          }
        />
        <InfoRow
          label="Sampled Frames"
          value={metadata.sampled_frames ?? "N/A"}
        />
        <InfoRow
          label="Valid Landmark Frames"
          value={metadata.valid_landmark_frames ?? "N/A"}
        />
      </div>
    </section>
  );
}

function EthicalNotice() {
  return (
    <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 text-blue-700" size={22} />

        <div>
          <h2 className="text-lg font-bold text-blue-950">
            Ethical Interpretation Notice
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-800">
            This report highlights behavioral inconsistency patterns and XAI
            explanations for interviewer review. It does not prove deception and
            should not replace human judgment, factual verification, or standard
            recruitment procedures.
          </p>
        </div>
      </div>
    </section>
  );
}

function TimelineStat({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <h3 className="mt-2 text-3xl font-bold text-gray-950">{value}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="max-w-xs text-right font-semibold text-gray-950">
        {value || "N/A"}
      </span>
    </div>
  );
}
