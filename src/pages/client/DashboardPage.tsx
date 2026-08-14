import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock, AlertCircle, BookX, FileText, Bookmark, Trophy } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { WEEKLY_RECORDS } from "@/data/mock";
import { useStore } from "@/store/useStore";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, questions, errorBook, collectedQuestions, examRecords } = useStore();

  const collectedCount = collectedQuestions.length;
  const errorCount = errorBook.length;
  const examCount = examRecords.length;

  const chartData = WEEKLY_RECORDS.map((r) => ({
    name: r.weekday,
    minutes: r.minutes,
    answered: r.answered,
  }));

  return (
    <div className="min-h-full bg-white">
      <header className="px-5 pt-6 pb-3">
        <BrushTitle size="lg" />
      </header>

      {/* 今日概况 */}
      <section className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            <Clock size={20} className="text-white/90 mb-2" />
            <p className="text-[10px] text-white/80 font-kai">今日学习</p>
            <p className="font-display text-3xl text-white leading-none mt-1">
              {currentUser.stats.todayMinutes}
              <span className="text-sm ml-1">分钟</span>
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #0369A1 0%, #075985 100%)" }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            <AlertCircle size={20} className="text-white/90 mb-2" />
            <p className="text-[10px] text-white/80 font-kai">当前错题率</p>
            <p className="font-display text-3xl text-white leading-none mt-1">
              {currentUser.stats.errorRate}
              <span className="text-sm ml-1">%</span>
            </p>
          </div>
        </div>
      </section>

      {/* 学情统计 */}
      <section className="px-5 mb-4">
        <h2 className="font-kai text-base font-bold text-navy-900 mb-2 flex items-center gap-1.5">
          <span className="seal-stamp text-[9px] px-1 py-0.5">学情</span>
          每周学情
        </h2>
        <div className="ink-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-navy-800/50 font-kai">学习时长（分钟）</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-navy-500" />
                <span className="text-navy-800/50">时长</span>
              </span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#0369A1", fontFamily: "Noto Serif SC" }}
                  axisLine={{ stroke: "rgba(14,165,233,0.1)" }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 9, fill: "#0369A1" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(14,165,233,0.08)" }}
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(14,165,233,0.15)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontFamily: "Noto Serif SC",
                  }}
                />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? "#0369A1" : "#0EA5E9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 综合掌握 + 排名 */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="ink-card rounded-2xl p-4 flex items-center gap-3">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none" stroke="#0369A1" strokeWidth="3"
                  strokeDasharray={`${currentUser.stats.mastery * 0.94} 100`} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-sm text-navy-700 font-bold">{currentUser.stats.mastery}%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-navy-800/50 font-kai">综合掌握</p>
              <p className="font-kai text-sm font-bold text-navy-900">本学段</p>
            </div>
          </div>

          <div className="ink-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
              <Trophy size={22} className="text-navy-700" />
            </div>
            <div>
              <p className="text-[10px] text-navy-800/50 font-kai">软件排名</p>
              <p className="font-display text-xl text-navy-900 font-bold leading-none mt-0.5">
                NO.{currentUser.stats.rank}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 学习工具 */}
      <section className="px-5 pb-6">
        <h2 className="font-kai text-base font-bold text-navy-900 mb-2 flex items-center gap-1.5">
          <span className="seal-stamp text-[9px] px-1 py-0.5">工具</span>
          学习工具
        </h2>
        <div className="space-y-2">
          <button
            onClick={() => navigate("/app/error-book")}
            className="w-full ink-card rounded-2xl p-3 flex items-center gap-3 hover:border-navy-500/40 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-500/12 flex items-center justify-center">
              <BookX size={18} className="text-navy-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-kai text-sm font-bold text-navy-900">错题本</p>
              <p className="text-[10px] text-navy-800/50 font-kai">复习错题·巩固薄弱</p>
            </div>
            <span className="text-[10px] text-navy-600 font-bold bg-navy-500/10 px-2 py-0.5 rounded-full">
              {errorCount} 题
            </span>
          </button>

          <button
            onClick={() => navigate("/app/scores")}
            className="w-full ink-card rounded-2xl p-3 flex items-center gap-3 hover:border-navy-400/40 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center">
              <FileText size={18} className="text-navy-700" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-kai text-sm font-bold text-navy-900">成绩单</p>
              <p className="text-[10px] text-navy-800/50 font-kai">模拟/真题·历次成绩</p>
            </div>
            <span className="text-[10px] text-navy-600 font-bold bg-navy-500/10 px-2 py-0.5 rounded-full">
              {examCount} 次
            </span>
          </button>

          <button
            onClick={() => navigate("/app/collected")}
            className="w-full ink-card rounded-2xl p-3 flex items-center gap-3 hover:border-navy-600/40 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-600/12 flex items-center justify-center">
              <Bookmark size={18} className="text-navy-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-kai text-sm font-bold text-navy-900">我的收藏</p>
              <p className="text-[10px] text-navy-800/50 font-kai">收藏题目·考前速记</p>
            </div>
            <span className="text-[10px] text-navy-600 font-bold bg-navy-600/10 px-2 py-0.5 rounded-full">
              {collectedCount} 题
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
