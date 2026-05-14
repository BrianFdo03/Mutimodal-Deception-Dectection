import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VideoAnalysisDashboard from "./pages/VideoAnalysisDashboard";
import SavedAnalysisPage from "./pages/SavedAnalysisPage";
import AnalysisHistoryPage from "./pages/AnalysisHistoryPage";
import CandidatesPage from "./pages/CandidatesPage";
import SessionsPage from "./pages/SessionsPage";
import MeetingDemoPage from "./pages/MeetingDemoPage";
import SettingsPage from "./pages/SettingsPage";
import ConsentPage from "./pages/ConsentPage";
import MeetingRoomPage from "./pages/MeetingRoomPage";
import ReportPreviewPage from "./pages/ReportPreviewPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
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
      {
        path: "candidates",
        element: <CandidatesPage />,
      },
      {
        path: "sessions",
        element: <SessionsPage />,
      },
      {
        path: "meeting-demo",
        element: <MeetingDemoPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "consent/:sessionId",
        element: <ConsentPage />,
      },
      {
        path: "meeting/:sessionId",
        element: <MeetingRoomPage />,
      },
      {
        path: "report/:analysisId",
        element: <ReportPreviewPage />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
