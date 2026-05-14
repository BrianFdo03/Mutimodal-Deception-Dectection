import { useRef, useState } from "react";

import { analyzeVideo } from "../services/videoAnalysisApi";

import VideoUploadCard from "../components/VideoUploadCard";
import VideoPreviewPlayer from "../components/VideoPreviewPlayer";
import AnalysisSummaryCards from "../components/AnalysisSummaryCards";
import InconsistencyTimeline from "../components/InconsistencyTimeline";
import FlaggedSegmentsTable from "../components/FlaggedSegmentsTable";

export default function VideoAnalysisDashboard() {
  const videoRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

      setAnalysis(response.data);
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

  return (
    // <div className="min-h-screen bg-gray-100">
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">
          Video Deception Analysis Dashboard
        </h1>

        <p className="text-gray-600 mt-2 max-w-3xl">
          Upload an interview video to generate a dynamic behavioral
          inconsistency timeline. The result is intended to support interviewer
          review, not to make an automatic hiring decision.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                Analysis Record
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
                  Segments:{" "}
                  <span className="font-semibold">
                    {analysis.timeline?.length || 0}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <VideoPreviewPlayer videoUrl={videoUrl} ref={videoRef} />
        </div>
      </div>

      <div className="mt-6">
        <AnalysisSummaryCards analysis={analysis} />
      </div>

      <div className="mt-6">
        <InconsistencyTimeline
          timeline={analysis?.timeline}
          onSegmentClick={handleSegmentClick}
        />
      </div>

      <div className="mt-6">
        <FlaggedSegmentsTable
          timeline={analysis?.timeline}
          onSegmentClick={handleSegmentClick}
        />
      </div>
    </div>
    // </div>
  );
}
