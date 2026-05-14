import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import VideoAnalysisDashboard from "./pages/VideoAnalysisDashboard";
import SavedAnalysisPage from "./pages/SavedAnalysisPage";
import AnalysisHistoryPage from "./pages/AnalysisHistoryPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/analyze-video" replace />,
      },
      {
        path: "analyze-video",
        element: <VideoAnalysisDashboard />,
      },
      {
        path: "saved-analysis",
        element: <SavedAnalysisPage />,
      },
      {
        path: "analysis-history",
        element: <AnalysisHistoryPage />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
