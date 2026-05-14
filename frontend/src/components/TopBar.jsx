import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": "Dashboard Overview",
  "/analyze-video": "New Video Analysis",
  "/analysis-history": "Analysis History",
  "/saved-analysis": "Saved Analysis Viewer",
  "/candidates": "Candidates",
  "/sessions": "Interview Sessions",
  "/meeting-demo": "Online Meeting Demo",
  "/settings": "Settings",
};

export default function TopBar() {
  const location = useLocation();

  let title = pageTitles[location.pathname] || "Multimodal Deception Detection";

  if (location.pathname.startsWith("/consent")) {
    title = "Candidate Consent";
  }
  if (location.pathname.startsWith("/meeting/")) {
    title = "Online Interview Room";
  }
  if (location.pathname.startsWith("/report/")) {
    title = "Behavioral Integrity Report";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">
        <div>
          <h2 className="text-xl font-bold text-gray-950">{title}</h2>
          <p className="text-sm text-gray-500">
            Recruiter dashboard for interview analysis and review.
          </p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              Demo Interviewer
            </p>
            <p className="text-xs text-gray-500">HR Evaluator</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white">
            DI
          </div>
        </div>
      </div>
    </header>
  );
}
