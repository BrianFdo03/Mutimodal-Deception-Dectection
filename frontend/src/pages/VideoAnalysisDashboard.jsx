import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { analyzeVideo } from "../services/videoAnalysisApi";

import VideoUploadCard from "../components/VideoUploadCard";
import VideoPreviewPlayer from "../components/VideoPreviewPlayer";
import AnalysisSummaryCards from "../components/AnalysisSummaryCards";
import InconsistencyTimeline from "../components/InconsistencyTimeline";
import FlaggedSegmentsTable from "../components/FlaggedSegmentsTable";

export default function VideoAnalysisDashboard() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    if (!Array.isArray(timeline)) {
      return [];
    }

    return timeline.map((item) => normalizeTimelineItem(item, modality));
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

  function normalizeAnalyzeResponse(rawAnalysis) {
    const fusionTimeline = normalizeTimeline(
      rawAnalysis.fusion?.timeline || rawAnalysis.timeline || [],
      "fusion",
    );

    const videoTimeline = normalizeTimeline(
      rawAnalysis.video?.timeline || [],
      "video",
    );

    const audioTimeline = normalizeTimeline(
      rawAnalysis.audio?.timeline || [],
      "audio",
    );

    const fusionStats = getTimelineStats(fusionTimeline);

    return {
      ...rawAnalysis,

      analysis_id: rawAnalysis.analysis_id || rawAnalysis.id,

      timelines: {
        fusion: fusionTimeline,
        video: videoTimeline,
        audio: audioTimeline,
      },

      scores: {
        fusion: {
          overall_score:
            rawAnalysis.fusion?.overall_score ?? rawAnalysis.overall_score ?? 0,
          overall_display_score:
            rawAnalysis.fusion?.overall_display_score ??
            rawAnalysis.fusion?.overall_score ??
            rawAnalysis.overall_score ??
            0,
          overall_risk:
            rawAnalysis.fusion?.overall_risk ||
            rawAnalysis.overall_risk ||
            "low",
        },

        video: {
          overall_score: rawAnalysis.video?.overall_score ?? 0,
          overall_risk: rawAnalysis.video?.overall_risk || "low",
        },

        audio: {
          overall_score: rawAnalysis.audio?.overall_score ?? 0,
          overall_risk: rawAnalysis.audio?.overall_risk || "low",
        },
      },

      // Backward-compatible fields for existing components.
      overall_score:
        rawAnalysis.fusion?.overall_score ?? rawAnalysis.overall_score ?? 0,
      overall_risk:
        rawAnalysis.fusion?.overall_risk || rawAnalysis.overall_risk || "low",
      timeline: fusionTimeline,

      total_segments: fusionStats.total,
      high_risk_segments: fusionStats.high,
      medium_risk_segments: fusionStats.medium,
      low_risk_segments: fusionStats.low,
    };
  }

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setErrorMessage("");

    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setErrorMessage("Please select a video first.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await analyzeVideo(selectedFile);

      if (!response.success) {
        throw new Error(response.message || "Analysis failed.");
      }

      const normalizedAnalysis = normalizeAnalyzeResponse(response.data);
      setAnalysis(normalizedAnalysis);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while analyzing the video.",
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

  const fusionTimeline = analysis?.timelines?.fusion || [];
  const videoScoreData = analysis?.scores?.video || {
    overall_score: 0,
    overall_risk: "low",
  };
  const audioScoreData = analysis?.scores?.audio || {
    overall_score: 0,
    overall_risk: "low",
  };
  const fusionScoreData = analysis?.scores?.fusion || {
    overall_score: 0,
    overall_risk: "low",
  };

  const flaggedFusionSegments = fusionTimeline.filter(
    (item) => item.risk === "high" || item.risk === "medium",
  );

  return (
    // <div className="min-h-screen bg-gray-100">
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">
          Multimodal Interview Analysis Dashboard
        </h1>

        <p className="text-gray-600 mt-2 max-w-3xl">
          Upload an interview video to generate visual, audio, and fused
          behavioral inconsistency timelines. The result is intended to support
          interviewer review, not to make an automatic hiring decision.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* {analysis && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
            <p className="font-semibold text-blue-950">
              Multimodal analysis completed
            </p>
            <p className="mt-2 leading-6">
              The uploaded interview was processed through the visual facial
              landmark model, the audio acoustic model, and a weighted fusion
              layer. The preview below shows the fused timeline. Open the full
              saved analysis to inspect Fusion, Video, and Audio timelines
              separately.
            </p>
          </div>
        )} */}

        <div className="space-y-6">
          <VideoUploadCard
            selectedFile={selectedFile}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          {analysis && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Multimodal Analysis Record
              </h2>

              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p>
                  Analysis ID:{" "}
                  <span className="font-semibold">{analysis.analysis_id}</span>
                </p>

                <p>
                  Video:{" "}
                  <span className="font-semibold">{analysis.video_name}</span>
                </p>

                <p>
                  Fusion Segments:{" "}
                  <span className="font-semibold">{fusionTimeline.length}</span>
                </p>

                <p>
                  Video Model:{" "}
                  <span className="font-semibold">
                    {videoScoreData.overall_risk?.toUpperCase()} (
                    {Number(videoScoreData.overall_score || 0).toFixed(2)})
                  </span>
                </p>

                <p>
                  Audio Model:{" "}
                  <span className="font-semibold">
                    {audioScoreData.overall_risk?.toUpperCase()} (
                    {Number(audioScoreData.overall_score || 0).toFixed(2)})
                  </span>
                </p>

                <p>
                  Fusion Result:{" "}
                  <span className="font-semibold">
                    {fusionScoreData.overall_risk?.toUpperCase()} (
                    {Number(fusionScoreData.overall_score || 0).toFixed(2)})
                  </span>
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(`/saved-analysis?id=${analysis.analysis_id}`)
                }
                className="mt-5 w-full rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Open Full Saved Analysis
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <VideoPreviewPlayer videoUrl={videoUrl} ref={videoRef} />
        </div>
      </div>

      {analysis && (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-blue-950">
                Multimodal analysis completed
              </p>

              <p className="mt-2 max-w-4xl leading-6">
                The uploaded interview was processed through the visual facial
                landmark model, the audio acoustic model, and a weighted fusion
                layer. The preview below shows the fused timeline. Open the full
                saved analysis to inspect Fusion, Video, and Audio timelines
                separately.
              </p>
            </div>

            <button
              onClick={() =>
                navigate(`/saved-analysis?id=${analysis.analysis_id}`)
              }
              className="shrink-0 rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900"
            >
              View Full Analysis
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <AnalysisSummaryCards analysis={analysis} />
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-950">
            Fusion Timeline Preview
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            This preview shows the fused multimodal timeline. Detailed
            modality-specific timelines are available in the saved analysis
            view.
          </p>
        </div>

        <InconsistencyTimeline
          timeline={fusionTimeline}
          onSegmentClick={handleSegmentClick}
        />
      </div>

      <div className="mt-6">
        <FlaggedSegmentsTable
          timeline={flaggedFusionSegments}
          onSegmentClick={handleSegmentClick}
        />
      </div>
    </div>
    // </div>
  );
}
