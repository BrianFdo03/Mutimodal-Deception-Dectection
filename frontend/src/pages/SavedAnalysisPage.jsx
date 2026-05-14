import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  deleteVideoAnalysisById,
  getVideoAnalysisById,
} from "../services/videoAnalysisApi";

import { unlinkAnalysisFromSessions } from "../services/localDataService";

import AnalysisSummaryCards from "../components/AnalysisSummaryCards";
import VideoPreviewPlayer from "../components/VideoPreviewPlayer";
import InconsistencyTimeline from "../components/InconsistencyTimeline";
import FlaggedSegmentsTable from "../components/FlaggedSegmentsTable";

export default function SavedAnalysisPage() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [analysisId, setAnalysisId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const idFromUrl = searchParams.get("id");

    if (idFromUrl) {
      loadAnalysisById(idFromUrl);
    }
  }, [searchParams]);

  async function handleLoadAnalysis(event) {
    event.preventDefault();
    await loadAnalysisById(analysisId.trim());
  }

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

      setAnalysis(response.data);
      setVideoUrl(response.data.video_url || "");
      setAnalysisId(String(id));
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

  async function handleDeleteAnalysis() {
    if (!analysis?.analysis_id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this analysis and its uploaded video file? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await deleteVideoAnalysisById(analysis.analysis_id);

      if (!response.success) {
        throw new Error("Could not delete analysis.");
      }

      setAnalysis(null);
      setVideoUrl("");
      setAnalysisId("");

      alert("Analysis and video file deleted successfully.");
      unlinkAnalysisFromSessions(analysis.analysis_id);
      navigate("/analysis-history");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while deleting the analysis.",
      );
    } finally {
      setIsLoading(false);
    }
  }

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

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/report/${analysis.analysis_id}`)}
                  className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Generate Report
                </button>

                <button
                  onClick={handleDeleteAnalysis}
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Delete Analysis
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="text-gray-500">Analysis ID</p>
                <p className="font-semibold text-gray-900">
                  {analysis.analysis_id}
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

          <div className="mt-6 mb-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm text-yellow-800">
            <p className="font-semibold text-yellow-950">
              Privacy and retention notice
            </p>
            <p className="mt-2 leading-6">
              Interview recordings and analysis outputs should only be retained
              for the required review period. Use Delete Analysis to remove the
              saved result and uploaded video file when it is no longer needed.
            </p>
          </div>

          <AnalysisSummaryCards analysis={analysis} />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VideoPreviewPlayer videoUrl={videoUrl} ref={videoRef} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Processing Metadata
              </h2>

              <div className="mt-4 space-y-3 text-sm">
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
              </div>
            </div>
          </div>

          <div className="mt-6">
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
          </div>
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
