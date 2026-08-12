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
import ClientLoginPage from "@/pages/client/ClientLoginPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminStats from "@/pages/admin/AdminStats";
import AdminVisual from "@/pages/admin/AdminVisual";
import { useStore } from "@/store/useStore";
import type { ReactNode } from "react";

/** 客户端路由守卫：未登录跳转登录页 */
function RequireClient({ children }: { children: ReactNode }) {
  const currentClientCode = useStore((s) => s.currentClientCode);
  if (!currentClientCode) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 客户端登录/注册 */}
        <Route path="/login" element={<ClientLoginPage />} />

        {/* 客户端（默认入口，需登录） */}
        <Route path="/" element={<RequireClient><ClientLayout /></RequireClient>}>
          <Route index element={<Navigate to="/app/home" replace />} />
        </Route>
        <Route path="/app" element={<RequireClient><ClientLayout /></RequireClient>}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        {/* 客户端全屏页 */}
        <Route path="/app/chapter/:subject" element={<RequireClient><ChapterSelectPage /></RequireClient>} />
        <Route path="/app/practice/:subject" element={<RequireClient><PracticePage /></RequireClient>} />
        <Route path="/app/practice/history" element={<RequireClient><PracticePage /></RequireClient>} />
        <Route path="/app/essay/:subject" element={<RequireClient><EssayPracticePage /></RequireClient>} />
        <Route path="/app/simulate" element={<RequireClient><SimulatePage /></RequireClient>} />
        <Route path="/app/error-book" element={<RequireClient><ErrorBookPage /></RequireClient>} />

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
