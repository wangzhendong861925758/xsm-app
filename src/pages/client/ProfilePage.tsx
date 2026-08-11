import { useNavigate } from "react-router-dom";
import { ChevronRight, Settings, Bell, HelpCircle, Info, LogOut, Flame, Target, Award, Clock } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { useStore } from "@/store/useStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const menuItems = [
    { icon: Bell, label: "学习提醒", color: "#0EA5E9" },
    { icon: Award, label: "我的成就", color: "#0369A1" },
    { icon: HelpCircle, label: "帮助与反馈", color: "#0284C7" },
    { icon: Info, label: "关于我们", color: "#075985" },
    { icon: Settings, label: "设置", color: "#0C4A6E" },
  ];

  return (
    <div className="min-h-full bg-paper bg-navy-radial">
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
              {currentUser.nickname.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-kai text-lg font-bold text-navy-900">{currentUser.nickname}</h2>
                <span className="seal-stamp text-[9px] px-1 py-0.5">学子</span>
              </div>
              <p className="text-[11px] text-navy-800/50 font-kai mt-0.5">{currentUser.grade}</p>
              <p className="text-[10px] text-navy-800/40 mt-1">
                加入于 {new Date(currentUser.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
            <button
              onClick={() => navigate("/app/profile/edit")}
              className="text-[10px] text-navy-600 border border-navy-500/30 px-2 py-1 rounded-full"
            >
              编辑
            </button>
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

        <p className="text-center text-[10px] text-navy-800/40 mt-4 font-kai">
          小四门刷题 · 中考必胜 v1.0
        </p>
      </section>
    </div>
  );
}
