function getRiskBadgeClass(risk) {
  if (risk === "high") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  if (risk === "medium") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return "bg-green-100 text-green-700 border-green-200";
}

export default function AnalysisSummaryCards({ analysis }) {
  if (!analysis) {
    return null;
  }

  const timeline = analysis.timeline || [];
  const highRiskCount = timeline.filter((item) => item.risk === "high").length;
  const mediumRiskCount = timeline.filter(
    (item) => item.risk === "medium",
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <p className="text-sm text-gray-500">Overall Score</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">
          {Number(analysis.overall_score).toFixed(2)}
        </h3>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <p className="text-sm text-gray-500">Overall Risk</p>
        <span
          className={`inline-flex mt-3 px-3 py-1 rounded-full text-sm font-semibold border ${getRiskBadgeClass(
            analysis.overall_risk,
          )}`}
        >
          {analysis.overall_risk?.toUpperCase()}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <p className="text-sm text-gray-500">High-Risk Segments</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">
          {highRiskCount}
        </h3>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <p className="text-sm text-gray-500">Medium-Risk Segments</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">
          {mediumRiskCount}
        </h3>
      </div>
    </div>
  );
}
