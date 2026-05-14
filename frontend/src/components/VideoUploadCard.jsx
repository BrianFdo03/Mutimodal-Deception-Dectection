export default function VideoUploadCard({
  selectedFile,
  onFileChange,
  onAnalyze,
  isLoading,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Upload Interview Video
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Upload an interview recording to generate a behavioral inconsistency
        timeline.
      </p>

      <div className="mt-5">
        <input
          type="file"
          accept="video/*"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>

      {selectedFile && (
        <div className="mt-3 text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedFile.name}</span>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={!selectedFile || isLoading}
        className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
          !selectedFile || isLoading
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
        {isLoading ? "Analyzing Video..." : "Analyze Video"}
      </button>
    </div>
  );
}
