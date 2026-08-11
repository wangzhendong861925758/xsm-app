import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import HomePage from "@/pages/client/HomePage";
import ExamPage from "@/pages/client/ExamPage";
import DashboardPage from "@/pages/client/DashboardPage";
import ProfilePage from "@/pages/client/ProfilePage";
import PracticePage from "@/pages/client/PracticePage";
import SimulatePage from "@/pages/client/SimulatePage";
import ErrorBookPage from "@/pages/client/ErrorBookPage";
import ChapterSelectPage from "@/pages/client/ChapterSelectPage";
import EssayPracticePage from "@/pages/client/EssayPracticePage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminStats from "@/pages/admin/AdminStats";
import AdminVisual from "@/pages/admin/AdminVisual";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 客户端（默认入口） */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Navigate to="/app/home" replace />} />
        </Route>
        <Route path="/app" element={<ClientLayout />}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        {/* 客户端全屏页 */}
        <Route path="/app/chapter/:subject" element={<ChapterSelectPage />} />
        <Route path="/app/practice/:subject" element={<PracticePage />} />
        <Route path="/app/practice/history" element={<PracticePage />} />
        <Route path="/app/essay/:subject" element={<EssayPracticePage />} />
        <Route path="/app/simulate" element={<SimulatePage />} />
        <Route path="/app/error-book" element={<ErrorBookPage />} />

        {/* 管理端（独立入口 /admin） */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/users" element={<AdminLayout />}>
          <Route index element={<AdminUsers />} />
        </Route>
        <Route path="/admin/questions" element={<AdminLayout />}>
          <Route index element={<AdminQuestions />} />
        </Route>
        <Route path="/admin/stats" element={<AdminLayout />}>
          <Route index element={<AdminStats />} />
        </Route>
        <Route path="/admin/visual" element={<AdminLayout />}>
          <Route index element={<AdminVisual />} />
        </Route>

        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Routes>
    </Router>
  );
}
