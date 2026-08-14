import { useNavigate } from "react-router-dom";
import { ChevronRight, Settings, Bell, HelpCircle, Info, LogOut, Flame, Target, Award, Clock, IdCard, ShieldCheck, ShieldOff } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { useStore } from "@/store/useStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, clientAccounts, currentClientCode, logoutClient } = useStore();
  const account = clientAccounts.find((a) => a.code === currentClientCode);

  const menuItems = [
    { icon: Bell, label: "学习提醒", color: "#0EA5E9" },
    { icon: Award, label: "我的成就", color: "#0369A1" },
    { icon: HelpCircle, label: "帮助与反馈", color: "#0284C7" },
    { icon: Info, label: "关于我们", color: "#075985" },
    { icon: Settings, label: "设置", color: "#0C4A6E" },
  ];

  return (
    <div className="min-h-full bg-white">
      <header className="px-5 pt-6 pb-3">
        <BrushTitle size="lg" />
      </header>

      {/* 个人信息卡 */}
      <section className="px-5 mb-4">
        <div className="ink-card rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-navy-500/5" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-navy-300/10" />
          <div className="relative flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-paper font-display text-2xl shadow-seal">
              {(account?.studentName || currentUser.nickname).charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-kai text-lg font-bold text-navy-900">
                  {account?.studentName || currentUser.nickname}
                </h2>
                <span className="seal-stamp text-[9px] px-1 py-0.5">学子</span>
              </div>
              {/* 8 位专属 ID */}
              <div className="flex items-center gap-1 mt-0.5">
                <IdCard size={11} className="text-navy-600" />
                <span className="text-[11px] text-navy-600 font-bold tracking-widest font-display">
                  {currentClientCode}
                </span>
              </div>
              <p className="text-[10px] text-navy-800/40 mt-1">
                加入于 {new Date(account?.createdAt || currentUser.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
            <button
              onClick={() => navigate("/app/profile/edit")}
              className="text-[10px] text-navy-600 border border-navy-500/30 px-2 py-1 rounded-full"
            >
              编辑
            </button>
          </div>

          {/* 权限状态条 */}
          <div
            className="relative mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
            style={{
              background: account?.granted ? "rgba(14,165,233,0.08)" : "rgba(234,179,8,0.10)",
            }}
          >
            {account?.granted ? (
              <>
                <ShieldCheck size={14} className="text-navy-600" />
                <span className="font-kai text-[11px] text-navy-700">
                  答题权限已开放
                  {account.expiresAt && (
                    <> · 到期 {new Date(account.expiresAt).toLocaleDateString("zh-CN")}</>
                  )}
                </span>
              </>
            ) : (
              <>
                <ShieldOff size={14} className="text-gold-dark" />
                <span className="font-kai text-[11px] text-gold-dark">
                  未开放权限 · 请联系管理员（ID: {currentClientCode}）
                </span>
              </>
            )}
          </div>

          <div className="relative grid grid-cols-4 gap-1 mt-4 pt-3 border-t border-navy-500/8">
            <div className="text-center">
              <Flame size={16} className="text-navy-500 mx-auto mb-0.5" />
              <p className="font-display text-base text-navy-900 font-bold leading-none">
                {currentUser.stats.streakDays}
              </p>
              <p className="text-[9px] text-navy-800/50 mt-0.5">坚持天数</p>
            </div>
            <div className="text-center">
              <Target size={16} className="text-navy-600 mx-auto mb-0.5" />
              <p className="font-display text-base text-navy-900 font-bold leading-none">
                {currentUser.stats.accuracy}%
              </p>
              <p className="text-[9px] text-navy-800/50 mt-0.5">正确率</p>
            </div>
            <div className="text-center">
              <Award size={16} className="text-navy-700 mx-auto mb-0.5" />
              <p className="font-display text-base text-navy-900 font-bold leading-none">
                NO.{currentUser.stats.rank}
              </p>
              <p className="text-[9px] text-navy-800/50 mt-0.5">排名</p>
            </div>
            <div className="text-center">
              <Clock size={16} className="text-navy-800/40 mx-auto mb-0.5" />
              <p className="font-display text-base text-navy-900 font-bold leading-none">
                {currentUser.stats.todayMinutes}
              </p>
              <p className="text-[9px] text-navy-800/50 mt-0.5">今日分钟</p>
            </div>
          </div>
        </div>
      </section>

      {/* 菜单列表 */}
      <section className="px-5 pb-6">
        <div className="ink-card rounded-2xl overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-500/5 transition-colors ${
                i !== menuItems.length - 1 ? "border-b border-navy-500/6" : ""
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${item.color}15` }}
              >
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <span className="flex-1 text-left font-kai text-sm text-navy-900">{item.label}</span>
              <ChevronRight size={16} className="text-navy-800/40" />
            </button>
          ))}
        </div>

        {/* 登出按钮 */}
        <button
          onClick={() => {
            logoutClient();
            navigate("/login", { replace: true });
          }}
          className="w-full mt-3 ink-card rounded-2xl py-3 flex items-center justify-center gap-1.5 font-kai text-sm text-gold-dark hover:bg-gold/5"
        >
          <LogOut size={15} />
          退出登录
        </button>

        <p className="text-center text-[10px] text-navy-800/40 mt-4 font-kai">
          小四门刷题 · 中考必胜 v1.0
        </p>
      </section>
    </div>
  );
}
