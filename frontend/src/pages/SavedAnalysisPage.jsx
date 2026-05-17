import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getVideoAnalysisById } from "../services/videoAnalysisApi";

import AnalysisSummaryCards from "../components/AnalysisSummaryCards";
import VideoPreviewPlayer from "../components/VideoPreviewPlayer";
import InconsistencyTimeline from "../components/InconsistencyTimeline";
import FlaggedSegmentsTable from "../components/FlaggedSegmentsTable";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function SavedAnalysisPage() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [analysisId, setAnalysisId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTimelineType, setSelectedTimelineType] = useState("fusion");

  useEffect(() => {
    const idFromUrl = searchParams.get("id");

    if (idFromUrl) {
      loadAnalysisById(idFromUrl);
    }
  }, [searchParams]);

  function buildVideoUrl(rawAnalysis) {
    const rawVideoUrl =
      rawAnalysis.video_url ||
      rawAnalysis.uploaded_video_url ||
      rawAnalysis.uploaded_file_url ||
      "";

    if (
      rawVideoUrl.startsWith("http://") ||
      rawVideoUrl.startsWith("https://")
    ) {
      return rawVideoUrl;
    }

    if (rawVideoUrl.startsWith("/")) {
      return `${API_BASE_URL}${rawVideoUrl}`;
    }

    if (rawVideoUrl) {
      return `${API_BASE_URL}/${rawVideoUrl}`;
    }

    console.log("Raw video_url:", rawAnalysis.video_url);
    console.log("Built video URL:", buildVideoUrl(rawAnalysis));

    return "";
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

      // Generic fields used by frontend components
      score,
      rawScore,
      smoothedScore,

      // Backward-compatible aliases for old components
      raw_score: rawScore,
      smoothed_score: smoothedScore,

      // Fusion-specific aliases
      raw_fusion_score:
        modality === "fusion" ? rawScore : item.raw_fusion_score,

      smoothed_fusion_score:
        modality === "fusion" ? smoothedScore : item.smoothed_fusion_score,

      display_score: score,

      risk: item.risk || "low",
      modality,
      explanation: item.explanation || null,
    };
  }

  function normalizeTimeline(timeline, modality) {
    if (!Array.isArray(timeline)) {
      return [];
    }

    return timeline.map((item) => normalizeTimelineItem(item, modality));
  }

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

  function getTimelineStats(timeline) {
    const high = timeline.filter((item) => item.risk === "high").length;
    const medium = timeline.filter((item) => item.risk === "medium").length;
    const low = timeline.filter((item) => item.risk === "low").length;

    return {
      total: timeline.length,
      high,
      medium,
      low,
    };
  }

  function formatScore(score) {
    if (score === null || score === undefined || Number.isNaN(Number(score))) {
      return "0%";
    }

    return `${Math.round(Number(score) * 100)}%`;
  }

  function getRiskLabel(risk) {
    if (!risk) return "Low";

    return risk.charAt(0).toUpperCase() + risk.slice(1);
  }

  async function handleLoadAnalysis(event) {
    event.preventDefault();
    await loadAnalysisById(analysisId.trim());
  }

  // async function loadAnalysisById(id) {
  //   if (!id) {
  //     setErrorMessage("Please enter an analysis ID.");
  //     return;
  //   }

  //   try {
  //     setIsLoading(true);
  //     setErrorMessage("");
  //     setAnalysis(null);
  //     setVideoUrl("");

  //     const response = await getVideoAnalysisById(id);

  //     if (!response.success) {
  //       throw new Error("Could not load saved analysis.");
  //     }

  //     setAnalysis(response.data);
  //     setVideoUrl(response.data.video_url || "");
  //     setAnalysisId(String(id));
  //   } catch (error) {
  //     console.error(error);
  //     setErrorMessage(
  //       error?.response?.data?.detail ||
  //         error.message ||
  //         "Something went wrong while loading the saved analysis.",
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  async function loadAnalysisById(id) {
    if (!id) {
      setErrorMessage("Please enter an analysis ID.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setAnalysis(null);
      setVideoUrl("");

      const response = await getVideoAnalysisById(id);

      if (!response.success) {
        throw new Error("Could not load saved analysis.");
      }

      const rawAnalysis = response.data;

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

      const normalizedAnalysis = {
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
      };

      setAnalysis(normalizedAnalysis);
      setVideoUrl(buildVideoUrl(rawAnalysis));
      setAnalysisId(String(id));
      setSelectedTimelineType("fusion");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while loading the saved analysis.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSegmentClick(segment) {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.currentTime = segment.start;
    videoRef.current.play();
  }

  const activeTimeline = analysis?.timelines?.[selectedTimelineType] || [];

  const activeScoreData = analysis?.scores?.[selectedTimelineType] || {
    overall_score: 0,
    overall_risk: "low",
  };

  const activeMetadata = analysis?.metadataByType?.[selectedTimelineType] || {};

  const activeStats = getTimelineStats(activeTimeline);

  const activeFlaggedSegments = activeTimeline.filter(
    (item) => item.risk === "high" || item.risk === "medium",
  );

  const activeAnalysis = analysis
    ? {
        ...analysis,
        overall_score: activeScoreData.overall_score,
        overall_risk: activeScoreData.overall_risk,
        metadata: activeMetadata,
        timeline: activeTimeline,
        total_segments: activeStats.total,
        high_risk_segments: activeStats.high,
        medium_risk_segments: activeStats.medium,
        low_risk_segments: activeStats.low,
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">
          Saved Analysis Viewer
        </h1>

        <p className="text-gray-600 mt-2 max-w-3xl">
          Load a previously saved video analysis using its analysis ID. This
          page retrieves the stored timeline, metadata, risk scores, and video
          file for review.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Load Analysis Record
        </h2>

        <form
          onSubmit={handleLoadAnalysis}
          className="mt-4 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="number"
            min="1"
            value={analysisId}
            onChange={(event) => setAnalysisId(event.target.value)}
            placeholder="Enter analysis ID, e.g. 1"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              isLoading
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isLoading ? "Loading..." : "Load Analysis"}
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      {analysis && (
        <>
          <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Analysis Details
              </h2>

              <button
                onClick={() =>
                  navigate(`/report/${analysis.analysis_id || analysis.id}`)
                }
                className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Generate Report
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="text-gray-500">Analysis ID</p>
                <p className="font-semibold text-gray-900">
                  {analysis.analysis_id || analysis.id}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Video Name</p>
                <p className="font-semibold text-gray-900">
                  {analysis.video_name}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Created At</p>
                <p className="font-semibold text-gray-900">
                  {analysis.created_at
                    ? new Date(analysis.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <AnalysisSummaryCards analysis={activeAnalysis} />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VideoPreviewPlayer videoUrl={videoUrl} ref={videoRef} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Processing Metadata
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                {selectedTimelineType === "fusion" && (
                  <>
                    <MetadataItem
                      label="Fusion Method"
                      value={activeMetadata.fusion_method}
                    />
                    <MetadataItem
                      label="Decision Score"
                      value={activeMetadata.decision_score}
                    />
                    <MetadataItem
                      label="Display Score"
                      value={activeMetadata.display_score}
                    />
                    <MetadataItem
                      label="Video Timeline Items"
                      value={activeMetadata.video_timeline_items}
                    />
                    <MetadataItem
                      label="Audio Timeline Items"
                      value={activeMetadata.audio_timeline_items}
                    />
                    <MetadataItem
                      label="Fused Timeline Items"
                      value={activeMetadata.fused_timeline_items}
                    />
                    {!activeMetadata.fusion_method && (
                      <MetadataItem
                        label="Metadata Note"
                        value="Legacy analysis record. Fusion metadata is not available."
                      />
                    )}
                  </>
                )}

                {selectedTimelineType === "video" && (
                  <>
                    <MetadataItem
                      label="Original FPS"
                      value={activeMetadata.original_fps}
                    />
                    <MetadataItem
                      label="Target FPS"
                      value={activeMetadata.target_fps}
                    />
                    <MetadataItem
                      label="Duration"
                      value={
                        activeMetadata.duration_seconds
                          ? `${Number(activeMetadata.duration_seconds).toFixed(2)}s`
                          : "N/A"
                      }
                    />
                    <MetadataItem
                      label="Valid Landmark Frames"
                      value={activeMetadata.valid_landmark_frames}
                    />
                    <MetadataItem
                      label="Missing Landmark Frames"
                      value={activeMetadata.missing_landmark_frames}
                    />
                    <MetadataItem
                      label="Feature Dimension"
                      value={activeMetadata.feature_dim}
                    />
                  </>
                )}

                {selectedTimelineType === "audio" && (
                  <>
                    <MetadataItem
                      label="Sample Rate"
                      value={activeMetadata.sample_rate}
                    />
                    <MetadataItem
                      label="Duration"
                      value={
                        activeMetadata.duration_seconds
                          ? `${Number(activeMetadata.duration_seconds).toFixed(2)}s`
                          : "N/A"
                      }
                    />
                    <MetadataItem
                      label="Window Seconds"
                      value={activeMetadata.window_seconds}
                    />
                    <MetadataItem
                      label="Stride Seconds"
                      value={activeMetadata.stride_seconds}
                    />
                    <MetadataItem
                      label="Audio Windows"
                      value={activeMetadata.num_windows}
                    />
                    <MetadataItem
                      label="Feature Count"
                      value={activeMetadata.feature_count}
                    />
                  </>
                )}
              </div>
              {/* <div className="mt-4 space-y-3 text-sm">
                <MetadataItem
                  label="Original FPS"
                  value={analysis.metadata?.original_fps}
                />
                <MetadataItem
                  label="Target FPS"
                  value={analysis.metadata?.target_fps}
                />
                <MetadataItem
                  label="Duration"
                  value={
                    analysis.metadata?.duration_seconds
                      ? `${Number(analysis.metadata.duration_seconds).toFixed(2)}s`
                      : "N/A"
                  }
                />
                <MetadataItem
                  label="Valid Landmark Frames"
                  value={analysis.metadata?.valid_landmark_frames}
                />
                <MetadataItem
                  label="Missing Landmark Frames"
                  value={analysis.metadata?.missing_landmark_frames}
                />
                <MetadataItem
                  label="Feature Dimension"
                  value={analysis.metadata?.feature_dim}
                />
              </div> */}
            </div>
          </div>

          <div className="mb-6 mt-6 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <TimelineTabButton
                label="Fusion Timeline"
                description="Combined video + audio"
                active={selectedTimelineType === "fusion"}
                onClick={() => setSelectedTimelineType("fusion")}
              />

              <TimelineTabButton
                label="Video Timeline"
                description="Facial landmark model"
                active={selectedTimelineType === "video"}
                onClick={() => setSelectedTimelineType("video")}
              />

              <TimelineTabButton
                label="Audio Timeline"
                description="Vocal acoustic model"
                active={selectedTimelineType === "audio"}
                onClick={() => setSelectedTimelineType("audio")}
              />
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
            <p className="font-semibold text-blue-950">
              {getTimelineTypeLabel(selectedTimelineType)} analysis view
            </p>

            <p className="mt-2 leading-6">
              {selectedTimelineType === "fusion" &&
                "This view combines visual facial landmark analysis and audio acoustic analysis using weighted late fusion. Raw fusion scores are used for risk decisions, while smoothed scores are used for timeline display."}

              {selectedTimelineType === "video" &&
                "This view shows the visual model output based on facial landmark movement patterns over time."}

              {selectedTimelineType === "audio" &&
                "This view shows the audio model output based on vocal acoustic features such as pitch activity, energy variation, and spectral changes."}
            </p>
          </div>

          <div className="mt-6">
            {activeTimeline.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                No {getTimelineTypeLabel(selectedTimelineType).toLowerCase()}{" "}
                timeline data is available for this analysis.
              </div>
            ) : (
              <InconsistencyTimeline
                timeline={activeTimeline}
                onSegmentClick={handleSegmentClick}
              />
            )}
          </div>

          <div className="mt-6">
            <FlaggedSegmentsTable
              timeline={activeFlaggedSegments}
              onSegmentClick={handleSegmentClick}
            />
          </div>
          {/* <div className="mt-6">
            <InconsistencyTimeline
              timeline={analysis.timeline}
              onSegmentClick={handleSegmentClick}
            />
          </div>

          <div className="mt-6">
            <FlaggedSegmentsTable
              timeline={analysis.timeline}
              onSegmentClick={handleSegmentClick}
            />
          </div> */}
        </>
      )}
    </div>
  );
}

function MetadataItem({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">
        {value !== undefined && value !== null ? value : "N/A"}
      </span>
    </div>
  );
}

function TimelineTabButton({ label, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-left transition ${
        active
          ? "bg-gray-950 text-white"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p
        className={`mt-1 text-xs ${active ? "text-gray-300" : "text-gray-500"}`}
      >
        {description}
      </p>
    </button>
  );
}

function getTimelineTypeLabel(type) {
  if (type === "fusion") return "Fusion";
  if (type === "video") return "Video";
  if (type === "audio") return "Audio";
  return "Analysis";
}
