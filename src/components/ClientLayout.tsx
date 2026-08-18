import { useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, BookOpen, BarChart3, User } from "lucide-react";
import { useStore } from "@/store/useStore";

const TABS = [
  { to: "/app/home", label: "首页", icon: Home },
  { to: "/app/exam", label: "备考冲刺", icon: BookOpen },
  { to: "/app/dashboard", label: "学情看板", icon: BarChart3 },
  { to: "/app/profile", label: "我的", icon: User },
];

export default function ClientLayout() {
  const checkAndRevokeExpired = useStore((s) => s.checkAndRevokeExpired);
  const alertedRef = useRef(false);

  useEffect(() => {
    const revoked = checkAndRevokeExpired();
    if (revoked && !alertedRef.current) {
      alertedRef.current = true;
      alert("您的答题权限已到期，请联系管理员开通权限");
    }
    const timer = setInterval(() => {
      const r = checkAndRevokeExpired();
      if (r && !alertedRef.current) {
        alertedRef.current = true;
        alert("您的答题权限已到期，请联系管理员开通权限");
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [checkAndRevokeExpired]);

  return (
    <div className="mobile-frame flex flex-col font-alibaba">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--frame-max)] bg-white z-50" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="flex items-stretch justify-around px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                  isActive ? "" : ""
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? "#3377FF" : "#B0B0B0"} fill={isActive ? "#3377FF" : "none"} />
                  <span className={`text-[11px] ${isActive ? "font-bold" : ""}`} style={{ color: isActive ? "#3377FF" : "#B0B0B0" }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
