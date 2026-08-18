﻿﻿﻿﻿﻿import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Award, Clock, TrendingUp, ListChecks } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function ScoreListPage() {
  const navigate = useNavigate();
  const { examRecords } = useStore();
  const [filter, setFilter] = useState<"all" | "mock" | "real">("all");

  const filtered =
    filter === "all" ? examRecords : examRecords.filter((r) => r.type === filter);

  // 倒序：最近完成的在前
  const sorted = [...filtered].sort((a, b) => b.completedAt - a.completedAt);

  // 统计
  const mockList = examRecords.filter((r) => r.type === "mock");
  const realList = examRecords.filter((r) => r.type === "real");
  const avg = (arr: typeof examRecords) =>
    arr.length === 0 ? 0 : Math.round(arr.reduce((s, r) => s + r.score, 0) / arr.length);
  const best = (arr: typeof examRecords) =>
    arr.length === 0 ? 0 : Math.max(...arr.map((r) => r.score));

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="mobile-frame flex flex-col bg-white">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-kai text-sm font-bold text-navy-900 flex items-center gap-1.5">
            <Award size={16} className="text-gold-dark" />
            成绩单
          </h1>
          <p className="text-[10px] text-navy-800/50 font-kai mt-0.5">
            共 {examRecords.length} 次考试记录
          </p>
        </div>
      </header>

      {/* 统计概览：纯白背景保证清晰 */}
      {examRecords.length > 0 && (
        <div className="px-4 py-3 border-b border-navy-500/8 grid grid-cols-3 gap-2 bg-white z-10">
          <div className="ink-card rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-navy-800/50 font-kai">模拟平均分</p>
            <p className="font-display text-lg font-bold text-navy-900">{avg(mockList)}</p>
          </div>
          <div className="ink-card rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-navy-800/50 font-kai">真题平均分</p>
            <p className="font-display text-lg font-bold text-navy-900">{avg(realList)}</p>
          </div>
          <div className="ink-card rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-navy-800/50 font-kai">最高分</p>
            <p className="font-display text-lg font-bold text-gold-dark">
              {Math.max(best(mockList), best(realList))}
            </p>
          </div>
        </div>
      )}

      {/* 类型筛选：纯白背景，文字清晰可读 */}
      {examRecords.length > 0 && (
        <div className="px-4 py-2 border-b border-navy-500/8 flex gap-1.5 bg-white z-20 sticky top-[65px]">
          {[
            { key: "all", label: "全部" },
            { key: "mock", label: "模拟" },
            { key: "real", label: "真题" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-kai transition-all ${
                filter === t.key ? "bg-navy-600 text-white" : "bg-navy-500/10 text-navy-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ListChecks size={40} className="text-navy-500/30 mb-3" />
            <p className="font-kai text-sm text-navy-800/50">
              {examRecords.length === 0 ? "还没有考试成绩" : "该类型暂无成绩"}
            </p>
            <p className="font-kai text-[11px] text-navy-800/40 mt-1">
              完成"全真模拟考试"或"真题考试"后这里会显示成绩
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((r, i) => {
              const isMock = r.type === "mock";
              const accent = isMock ? "#1e3a8a" : "#b45309";
              const pass = r.score >= 60;
              return (
                <div
                  key={`${r.paperId}-${r.completedAt}-${i}`}
                  className="ink-card rounded-2xl p-3.5"
                  style={{ borderLeft: `3px solid ${accent}` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                      style={{ background: accent }}
                    >
                      {isMock ? "模拟" : "真题"}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        pass
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {pass ? "及格" : "未及格"}
                    </span>
                    <span className="ml-auto text-[10px] text-navy-800/40 font-kai flex items-center gap-0.5">
                      <Clock size={10} />
                      {fmtTime(r.completedAt)}
                    </span>
                  </div>
                  <p className="font-kai text-sm text-navy-900 leading-snug mb-2 line-clamp-2">
                    {r.title}
                  </p>
                  <div className="flex items-end justify-between">
                    <div className="text-[11px] text-navy-800/60 font-kai">
                      <TrendingUp size={11} className="inline mr-1" />
                      对 {r.correctCount} / {r.totalQuestions} 题
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-navy-900">
                        {r.score}
                      </span>
                      <span className="text-[10px] text-navy-800/40 font-kai ml-0.5">分</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
