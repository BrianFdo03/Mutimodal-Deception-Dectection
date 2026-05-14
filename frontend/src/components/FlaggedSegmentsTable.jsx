function getRiskBadgeClass(risk) {
  if (risk === "high") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  if (risk === "medium") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return "bg-green-100 text-green-700 border-green-200";
}

export default function FlaggedSegmentsTable({ timeline, onSegmentClick }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Flagged Segments
        </h2>
        <div className="mt-4 text-gray-400">No segments available yet.</div>
      </div>
    );
  }

  const flaggedSegments = timeline.filter(
    (item) => item.risk === "medium" || item.risk === "high",
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Flagged Segments for Review
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        These segments indicate behavioral inconsistency and should be reviewed
        by the interviewer.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-3 pr-4">Time Range</th>
              <th className="py-3 pr-4">Raw Score</th>
              <th className="py-3 pr-4">Smoothed Score</th>
              <th className="py-3 pr-4">Risk</th>
              <th className="py-3 pr-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {flaggedSegments.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-gray-400">
                  No medium or high-risk segments found.
                </td>
              </tr>
            ) : (
              flaggedSegments.map((segment) => (
                <tr
                  key={segment.window_index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {segment.start}s - {segment.end}s
                  </td>

                  <td className="py-3 pr-4">
                    {Number(segment.raw_score).toFixed(4)}
                  </td>

                  <td className="py-3 pr-4">
                    {Number(segment.smoothed_score).toFixed(4)}
                  </td>

                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-1 rounded-full border text-xs font-semibold ${getRiskBadgeClass(
                        segment.risk,
                      )}`}
                    >
                      {segment.risk.toUpperCase()}
                    </span>
                  </td>

                  <td className="py-3 pr-4">
                    <button
                      onClick={() => onSegmentClick(segment)}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs hover:bg-gray-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
