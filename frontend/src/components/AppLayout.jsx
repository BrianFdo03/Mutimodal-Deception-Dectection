import { Outlet } from "react-router-dom";
import TopNavigation from "./TopNavigation";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavigation />
      <Outlet />
    </div>
  );
}
