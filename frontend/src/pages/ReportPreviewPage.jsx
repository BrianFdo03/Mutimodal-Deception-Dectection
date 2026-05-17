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

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function ensureObject(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeTimelineItem(item, modality = "fusion") {
  const start = item.start ?? item.start_time ?? item.startTime ?? 0;
  const end = item.end ?? item.end_time ?? item.endTime ?? start;

  let score = 0;
  let rawScore = 0;
  let smoothedScore = 0;

  if (modality === "fusion") {
    rawScore =
      item.raw_fusion_score ??
      item.fusion_score ??
      item.raw_score ??
      item.score ??
      0;

    smoothedScore =
      item.smoothed_fusion_score ??
      item.display_score ??
      item.fusion_score ??
      rawScore;

    score = smoothedScore;
  } else {
    rawScore = item.raw_score ?? item.score ?? item.deception_score ?? 0;

    smoothedScore =
      item.smoothed_score ?? item.display_score ?? item.score ?? rawScore;

    score = smoothedScore;
  }

  return {
    ...item,
    start,
    end,
    startTime: start,
    endTime: end,
    score,
    rawScore,
    smoothedScore,
    raw_score: rawScore,
    smoothed_score: smoothedScore,
    display_score: score,
    risk: item.risk || "low",
    modality,
    explanation: item.explanation || null,
  };
}

function normalizeTimeline(timeline, modality) {
  return ensureArray(timeline).map((item) =>
    normalizeTimelineItem(item, modality),
  );
}

function getTimelineFromRawAnalysis(rawAnalysis, type) {
  if (type === "fusion") {
    return ensureArray(
      rawAnalysis.fusion_timeline_json ||
        rawAnalysis.timeline_json ||
        rawAnalysis.timeline ||
        rawAnalysis.fusion?.timeline ||
        rawAnalysis.analysis_result_json?.fusion?.timeline ||
        [],
    );
  }

  if (type === "video") {
    return ensureArray(
      rawAnalysis.video_timeline_json ||
        rawAnalysis.video?.timeline ||
        rawAnalysis.analysis_result_json?.video?.timeline ||
        [],
    );
  }

  if (type === "audio") {
    return ensureArray(
      rawAnalysis.audio_timeline_json ||
        rawAnalysis.audio?.timeline ||
        rawAnalysis.analysis_result_json?.audio?.timeline ||
        [],
    );
  }

  return [];
}

function getMetadataFromRawAnalysis(rawAnalysis, type) {
  if (type === "fusion") {
    return ensureObject(
      rawAnalysis.fusion_metadata_json ||
        rawAnalysis.metadata_json ||
        rawAnalysis.metadata ||
        rawAnalysis.fusion?.metadata ||
        rawAnalysis.analysis_result_json?.fusion?.metadata ||
        {},
    );
  }

  if (type === "video") {
    return ensureObject(
      rawAnalysis.video_metadata_json ||
        rawAnalysis.video?.metadata ||
        rawAnalysis.analysis_result_json?.video?.metadata ||
        {},
    );
  }

  if (type === "audio") {
    return ensureObject(
      rawAnalysis.audio_metadata_json ||
        rawAnalysis.audio?.metadata ||
        rawAnalysis.analysis_result_json?.audio?.metadata ||
        {},
    );
  }

  return {};
}

function getScoreFromRawAnalysis(rawAnalysis, type) {
  if (type === "fusion") {
    return {
      overall_score:
        rawAnalysis.fusion_overall_score ??
        rawAnalysis.fusion?.overall_score ??
        rawAnalysis.overall_score ??
        0,
      overall_display_score:
        rawAnalysis.fusion_overall_display_score ??
        rawAnalysis.fusion?.overall_display_score ??
        rawAnalysis.fusion_overall_score ??
        rawAnalysis.fusion?.overall_score ??
        rawAnalysis.overall_score ??
        0,
      overall_risk:
        rawAnalysis.fusion_overall_risk ||
        rawAnalysis.fusion?.overall_risk ||
        rawAnalysis.overall_risk ||
        "low",
    };
  }

  if (type === "video") {
    return {
      overall_score:
        rawAnalysis.video_overall_score ??
        rawAnalysis.video?.overall_score ??
        0,
      overall_risk:
        rawAnalysis.video_overall_risk ||
        rawAnalysis.video?.overall_risk ||
        "low",
    };
  }

  if (type === "audio") {
    return {
      overall_score:
        rawAnalysis.audio_overall_score ??
        rawAnalysis.audio?.overall_score ??
        0,
      overall_risk:
        rawAnalysis.audio_overall_risk ||
        rawAnalysis.audio?.overall_risk ||
        "low",
    };
  }

  return {
    overall_score: 0,
    overall_risk: "low",
  };
}

function normalizeReportAnalysis(rawAnalysis) {
  const fusionTimeline = normalizeTimeline(
    getTimelineFromRawAnalysis(rawAnalysis, "fusion"),
    "fusion",
  );

  const videoTimeline = normalizeTimeline(
    getTimelineFromRawAnalysis(rawAnalysis, "video"),
    "video",
  );

  const audioTimeline = normalizeTimeline(
    getTimelineFromRawAnalysis(rawAnalysis, "audio"),
    "audio",
  );

  return {
    ...rawAnalysis,

    analysis_id: rawAnalysis.analysis_id || rawAnalysis.id,

    timelines: {
      fusion: fusionTimeline,
      video: videoTimeline,
      audio: audioTimeline,
    },

    scores: {
      fusion: getScoreFromRawAnalysis(rawAnalysis, "fusion"),
      video: getScoreFromRawAnalysis(rawAnalysis, "video"),
      audio: getScoreFromRawAnalysis(rawAnalysis, "audio"),
    },

    metadataByType: {
      fusion: getMetadataFromRawAnalysis(rawAnalysis, "fusion"),
      video: getMetadataFromRawAnalysis(rawAnalysis, "video"),
      audio: getMetadataFromRawAnalysis(rawAnalysis, "audio"),
    },

    // Main report result = fusion result
    overall_score:
      getScoreFromRawAnalysis(rawAnalysis, "fusion").overall_score ?? 0,
    overall_risk:
      getScoreFromRawAnalysis(rawAnalysis, "fusion").overall_risk || "low",
    timeline: fusionTimeline,
    metadata: getMetadataFromRawAnalysis(rawAnalysis, "fusion"),
  };
}

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

      const loadedAnalysis = normalizeReportAnalysis(response.data);
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
    const fusionTimeline = analysis?.timelines?.fusion || [];

    const highRiskSegments = fusionTimeline.filter(
      (segment) => segment.risk === "high",
    );

    const mediumRiskSegments = fusionTimeline.filter(
      (segment) => segment.risk === "medium",
    );

    const lowRiskSegments = fusionTimeline.filter(
      (segment) => segment.risk === "low",
    );

    return {
      totalSegments: fusionTimeline.length,
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
              label="Fusion Risk"
              value={<RiskBadge risk={analysis.scores?.fusion?.overall_risk} />}
            />

            <SummaryCard
              label="Fusion Score"
              value={Number(
                analysis.scores?.fusion?.overall_score || 0,
              ).toFixed(2)}
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

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Multimodal Result Breakdown
                </h2>
                <p className="text-sm text-gray-500">
                  Fusion is used as the primary report result, with video and
                  audio shown as supporting modality outputs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ModalityScoreCard
                label="Fusion Result"
                description="Combined video + audio score"
                score={analysis.scores?.fusion?.overall_score}
                risk={analysis.scores?.fusion?.overall_risk}
              />

              <ModalityScoreCard
                label="Video Model"
                description="Facial landmark movement analysis"
                score={analysis.scores?.video?.overall_score}
                risk={analysis.scores?.video?.overall_risk}
              />

              <ModalityScoreCard
                label="Audio Model"
                description="Vocal acoustic feature analysis"
                score={analysis.scores?.audio?.overall_score}
                risk={analysis.scores?.audio?.overall_risk}
              />
            </div>
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
                      <th className="px-5 py-3">Fusion Score</th>
                      <th className="px-5 py-3">Video / Audio</th>
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
                            segment.display_score ??
                              segment.smoothed_fusion_score ??
                              segment.raw_fusion_score ??
                              segment.score ??
                              0,
                          ).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          <p>
                            Video:{" "}
                            <span className="font-semibold">
                              {getSegmentVideoScore(segment) !== null
                                ? Number(getSegmentVideoScore(segment)).toFixed(
                                    2,
                                  )
                                : "N/A"}
                            </span>
                          </p>

                          <p className="mt-1">
                            Audio:{" "}
                            <span className="font-semibold">
                              {getSegmentAudioScore(segment) !== null
                                ? Number(getSegmentAudioScore(segment)).toFixed(
                                    2,
                                  )
                                : "N/A"}
                            </span>
                          </p>
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          <p>
                            {segment.explanation?.detail ||
                              segment.explanation?.summary ||
                              "No explanation available for this segment."}
                          </p>

                          {segment.explanation?.video_factors?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-500">
                                Visual factors
                              </p>
                              <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-600">
                                {segment.explanation.video_factors.map(
                                  (factor) => (
                                    <li key={factor}>{factor}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                          {segment.explanation?.audio_factors?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-500">
                                Audio factors
                              </p>
                              <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-600">
                                {segment.explanation.audio_factors.map(
                                  (factor) => (
                                    <li key={factor}>{factor}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

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
              Generated by RecruitAI Interview Integrity Assistant. This
              multimodal report combines visual, audio, and fusion-based
              behavioral inconsistency outputs. It is intended for internal
              human review and should not be interpreted as proof of deception
              or used as the sole basis for hiring decisions.
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
            This report summarizes multimodal behavioral inconsistency analysis
            using visual facial-landmark patterns, audio acoustic features, and
            fused timeline outputs generated for interviewer review.
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
  const fusionMetadata = analysis.metadataByType?.fusion || {};
  const videoMetadata = analysis.metadataByType?.video || {};
  const audioMetadata = analysis.metadataByType?.audio || {};

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          <CalendarDays size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-950">Analysis Details</h2>
          <p className="text-sm text-gray-500">
            Multimodal processing metadata and stored result details
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

        <InfoRow
          label="Fusion Method"
          value={fusionMetadata.fusion_method || "Weighted late fusion"}
        />

        <InfoRow
          label="Decision Score"
          value={fusionMetadata.decision_score || "raw_fusion_score"}
        />

        <InfoRow
          label="Display Score"
          value={fusionMetadata.display_score || "smoothed_fusion_score"}
        />

        <InfoRow
          label="Video Timeline Items"
          value={
            fusionMetadata.video_timeline_items ??
            analysis.timelines?.video?.length ??
            "N/A"
          }
        />

        <InfoRow
          label="Audio Timeline Items"
          value={
            fusionMetadata.audio_timeline_items ??
            analysis.timelines?.audio?.length ??
            "N/A"
          }
        />

        <InfoRow
          label="Video Duration"
          value={
            videoMetadata.duration_seconds
              ? `${Number(videoMetadata.duration_seconds).toFixed(2)}s`
              : audioMetadata.duration_seconds
                ? `${Number(audioMetadata.duration_seconds).toFixed(2)}s`
                : "N/A"
          }
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

function ModalityScoreCard({ label, description, score, risk }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-950">{label}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <RiskBadge risk={risk || "low"} />
      </div>

      <p className="mt-5 text-3xl font-bold text-gray-950">
        {Number(score || 0).toFixed(2)}
      </p>

      <p className="mt-1 text-xs text-gray-500">Overall model score</p>
    </div>
  );
}

function getSegmentVideoScore(segment) {
  const score =
    segment.raw_video_score ??
    segment.display_video_score ??
    segment.video_score ??
    segment.explanation?.video_score ??
    null;

  return score !== null && score !== undefined ? score : null;
}

function getSegmentAudioScore(segment) {
  const score =
    segment.raw_audio_score ??
    segment.display_audio_score ??
    segment.audio_score ??
    segment.explanation?.audio_score ??
    null;

  return score !== null && score !== undefined ? score : null;
}
