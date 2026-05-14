import { forwardRef } from "react";

const VideoPreviewPlayer = forwardRef(function VideoPreviewPlayer(
  { videoUrl },
  videoRef,
) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Interview Video Preview
      </h2>

      <div className="mt-4 bg-black rounded-xl overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-h-[420px]"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Video file is not available
          </div>
        )}
      </div>
    </div>
  );
});

export default VideoPreviewPlayer;
