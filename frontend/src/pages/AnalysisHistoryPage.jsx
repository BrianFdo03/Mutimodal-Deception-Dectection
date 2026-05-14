import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getVideoAnalysisHistory } from "../services/videoAnalysisApi";

function getRiskBadgeClass(risk) {
  if (risk === "high") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  if (risk === "medium") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return "bg-green-100 text-green-700 border-green-200";
}

export default function AnalysisHistoryPage() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getVideoAnalysisHistory();

      if (!response.success) {
        throw new Error("Failed to load analysis history.");
      }

      setAnalyses(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while loading analysis history.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const matchesSearch =
        item.video_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        String(item.analysis_id).includes(searchText);

      const matchesRisk =
        riskFilter === "all" || item.overall_risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [analyses, searchText, riskFilter]);

  function openAnalysis(analysisId) {
    navigate(`/saved-analysis?id=${analysisId}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">Analysis History</h1>

          <p className="text-gray-600 mt-2 max-w-3xl">
            View previously saved video analysis records, review risk summaries,
            and reopen timelines for detailed inspection.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-semibold hover:bg-gray-800"
        >
          Refresh History
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Analyses" value={analyses.length} />
        <SummaryCard
          label="High Risk"
          value={analyses.filter((item) => item.overall_risk === "high").length}
        />
        <SummaryCard
          label="Medium Risk"
          value={
            analyses.filter((item) => item.overall_risk === "medium").length
          }
        />
        <SummaryCard
          label="Low Risk"
          value={analyses.filter((item) => item.overall_risk === "low").length}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by analysis ID or video name"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Saved Analysis Records
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredAnalyses.length} of {analyses.length} records.
          </p>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-500">
            Loading analysis history...
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No saved analysis records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">Video</th>
                  <th className="py-3 px-6">Overall Score</th>
                  <th className="py-3 px-6">Risk</th>
                  <th className="py-3 px-6">Segments</th>
                  <th className="py-3 px-6">High / Medium</th>
                  <th className="py-3 px-6">Video File</th>
                  <th className="py-3 px-6">Created</th>
                  <th className="py-3 px-6">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAnalyses.map((item) => (
                  <tr
                    key={item.analysis_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      #{item.analysis_id}
                    </td>

                    <td className="py-4 px-6 text-gray-700 max-w-xs truncate">
                      {item.video_name}
                    </td>

                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {Number(item.overall_score).toFixed(2)}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full border text-xs font-semibold ${getRiskBadgeClass(
                          item.overall_risk,
                        )}`}
                      >
                        {item.overall_risk?.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-gray-700">
                      {item.segment_count}
                    </td>

                    <td className="py-4 px-6 text-gray-700">
                      {item.high_risk_count} / {item.medium_risk_count}
                    </td>

                    <td className="py-4 px-6">
                      {item.video_file_exists ? (
                        <span className="text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-1 text-xs font-semibold">
                          Available
                        </span>
                      ) : (
                        <span className="text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-1 text-xs font-semibold">
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-gray-700">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openAnalysis(item.analysis_id)}
                          className="rounded-lg bg-gray-900 text-white px-4 py-2 text-xs font-semibold hover:bg-gray-800"
                        >
                          Open
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/report/${item.analysis_id}`)
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
    </div>
  );
}
