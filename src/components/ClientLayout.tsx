import { NavLink, Outlet } from "react-router-dom";
import { Home, BookOpen, BarChart3, User } from "lucide-react";

const TABS = [
  { to: "/app/home", label: "首页", icon: Home },
  { to: "/app/exam", label: "备考冲刺", icon: BookOpen },
  { to: "/app/dashboard", label: "学情看板", icon: BarChart3 },
  { to: "/app/profile", label: "我的", icon: User },
];

/**
 * 客户端布局：竖屏容器 + 底部Tab栏
 */
export default function ClientLayout() {
  return (
    <div className="mobile-frame flex flex-col">
      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* 底部Tab栏 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--frame-max)] bg-paper-light/95 backdrop-blur border-t border-navy-500/10 z-50">
        <div className="flex items-stretch justify-around px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  isActive ? "text-navy-600" : "text-navy-800/40"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className={`text-[10px] ${isActive ? "font-bold" : ""}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
