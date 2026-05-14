import { NavLink } from "react-router-dom";

function getNavClass({ isActive }) {
  return isActive
    ? "px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
    : "px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold";
}

export default function TopNavigation() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-950">
            Multimodal Deception Detection
          </h1>
          <p className="text-xs text-gray-500">
            Interview analysis and behavioral inconsistency review
          </p>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink to="/analyze-video" className={getNavClass}>
            New Analysis
          </NavLink>

          <NavLink to="/saved-analysis" className={getNavClass}>
            Saved Analysis
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
