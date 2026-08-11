import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { Users, FileQuestion, BarChart3, LogOut, Shield, Palette } from "lucide-react";
import { useStore } from "@/store/useStore";

const NAV = [
  { to: "/admin/users", label: "用户管理", icon: Users },
  { to: "/admin/questions", label: "题库管理", icon: FileQuestion },
  { to: "/admin/stats", label: "数据统计", icon: BarChart3 },
  { to: "/admin/visual", label: "可视化配置", icon: Palette },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { adminLoggedIn, setAdminLoggedIn } = useStore();

  if (!adminLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    setAdminLoggedIn(false);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-paper bg-navy-radial flex">
      {/* 侧边栏 */}
      <aside className="w-56 bg-paper-light border-r border-navy-500/15 flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-navy-500/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-navy-600/12 flex items-center justify-center">
              <Shield size={18} className="text-navy-600" />
            </div>
            <div>
              <h1 className="brush-title text-lg text-navy-900 leading-none">小四门</h1>
              <p className="text-[9px] text-navy-800/60 mt-0.5 font-kai">管理后台</p>
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-kai transition-all ${
                  isActive
                    ? "bg-navy-600 text-paper shadow-seal"
                    : "text-navy-900/70 hover:bg-navy-500/8"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* 底部 */}
        <div className="px-3 py-3 border-t border-navy-500/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-kai text-gold-dark hover:bg-gold/8 transition-colors"
          >
            <LogOut size={17} />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 ml-56 p-6">
        <Outlet />
      </main>
    </div>
  );
}
