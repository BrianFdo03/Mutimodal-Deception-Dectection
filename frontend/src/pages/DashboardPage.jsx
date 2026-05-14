import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  FileSearch,
  History,
  Upload,
  Users,
} from "lucide-react";

import { getVideoAnalysisHistory } from "../services/videoAnalysisApi";
import StatCard from "../components/StatCard";
import RiskBadge from "../components/RiskBadge";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getVideoAnalysisHistory();

      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load dashboard analysis history.");
    } finally {
      setIsLoading(false);
    }
  }

  const dashboardStats = useMemo(() => {
    const totalAnalyses = history.length;
    const highRisk = history.filter(
      (item) => item.overall_risk === "high",
    ).length;
    const mediumRisk = history.filter(
      (item) => item.overall_risk === "medium",
    ).length;

    const averageScore =
      totalAnalyses > 0
        ? history.reduce(
            (sum, item) => sum + Number(item.overall_score || 0),
            0,
          ) / totalAnalyses
        : 0;

    return {
      totalAnalyses,
      highRisk,
      mediumRisk,
      averageScore,
    };
  }, [history]);

  const recentAnalyses = history.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">
            Interview Analysis Dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Monitor virtual interview reviews, inspect recent behavioral
            inconsistency results, and start new candidate assessments.
          </p>
        </div>

        <button
          onClick={() => navigate("/analyze-video")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Upload size={18} />
          Start New Analysis
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Saved Analyses"
          value={dashboardStats.totalAnalyses}
          subtitle="Total video analysis records"
          icon={FileSearch}
        />

        <StatCard
          title="High-Risk Reviews"
          value={dashboardStats.highRisk}
          subtitle="Segments requiring careful review"
          icon={AlertTriangle}
        />

        <StatCard
          title="Medium-Risk Reviews"
          value={dashboardStats.mediumRisk}
          subtitle="Potentially review-worthy records"
          icon={History}
        />

        <StatCard
          title="Average Score"
          value={dashboardStats.averageScore.toFixed(2)}
          subtitle="Mean behavioral inconsistency score"
          icon={CalendarDays}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Recent Analyses
              </h2>
              <p className="text-sm text-gray-500">
                Latest video analysis records saved in the system.
              </p>
            </div>

            <button
              onClick={() => navigate("/analysis-history")}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading recent analyses...
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No analyses found yet. Start by uploading an interview video.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Video</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Risk</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAnalyses.map((item) => (
                    <tr
                      key={item.analysis_id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-950">
                        #{item.analysis_id}
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate text-gray-700">
                        {item.video_name}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-950">
                        {Number(item.overall_score).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <RiskBadge risk={item.overall_risk} />
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            navigate(`/saved-analysis?id=${item.analysis_id}`)
                          }
                          className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Quick Actions
            </h2>

            <div className="mt-5 space-y-3">
              <QuickAction
                icon={Upload}
                title="Analyze Interview Video"
                description="Upload a new interview recording."
                onClick={() => navigate("/analyze-video")}
              />

              <QuickAction
                icon={Users}
                title="Manage Candidates"
                description="View and track candidate profiles."
                onClick={() => navigate("/candidates")}
              />

              <QuickAction
                icon={CalendarDays}
                title="Interview Sessions"
                description="Schedule and review sessions."
                onClick={() => navigate("/sessions")}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-lg font-semibold text-blue-950">
              Review Policy
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Timeline scores and explanations are generated to support human
              review. They should not be treated as proof of deception or used
              as the only basis for hiring decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50"
    >
      <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
        <Icon size={20} />
      </div>

      <div>
        <p className="font-semibold text-gray-950">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
}
