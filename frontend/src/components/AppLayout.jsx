import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
// import TopNavigation from "./TopNavigation";

// export default function AppLayout() {
//   return (
//     <div className="min-h-screen bg-gray-100">
//       <TopNavigation />
//       <Outlet />
//     </div>
//   );
// }
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="lg:pl-72">
        <TopBar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
