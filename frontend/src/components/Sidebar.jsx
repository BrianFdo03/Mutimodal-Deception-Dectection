import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  History,
  FileSearch,
  Users,
  CalendarDays,
  MonitorPlay,
  Settings,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "New Analysis",
    path: "/analyze-video",
    icon: Video,
  },
  {
    label: "Analysis History",
    path: "/analysis-history",
    icon: History,
  },
  {
    label: "Saved Analysis",
    path: "/saved-analysis",
    icon: FileSearch,
  },
  {
    label: "Candidates",
    path: "/candidates",
    icon: Users,
  },
  {
    label: "Interview Sessions",
    path: "/sessions",
    icon: CalendarDays,
  },
  {
    label: "Meeting Room",
    path: "/meeting-demo",
    icon: MonitorPlay,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function getNavClass({ isActive }) {
  return isActive
    ? "flex items-center gap-3 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white"
    : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-950";
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-gray-200 bg-white px-5 py-6 lg:block">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h1 className="text-base font-bold text-gray-950">VeriView</h1>
          <p className="text-xs text-gray-500">Interview Integrity Assistant</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.path} to={item.path} className={getNavClass}>
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-900">
          Decision-support mode
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          The system flags behavioral inconsistencies for human review. It does
          not make final hiring decisions.
        </p>
      </div>
    </aside>
  );
}
