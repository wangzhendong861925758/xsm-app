﻿﻿﻿﻿﻿﻿import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  CheckCircle2,
  Circle,
  ChevronRight,
  FileText,
  Library,
  Award,
  Flame,
  Target,
} from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { EXPERT_NOTES } from "@/data/expertNotes";
import { EXAM_PAPERS } from "@/data/examPapers";
import { useStore } from "@/store/useStore";

export default function ExamPage() {
  const navigate = useNavigate();
  const {
    questions,
    examRecords,
  } = useStore();

  // 真实统计：收藏、掌握、未掌握
  const collected = questions.filter((q) => q.collected).length;
  const mastered = questions.filter((q) => q.mastered).length;
  const unmastered = questions.length - mastered;

  // 考试记录统计
  const examCount = examRecords.length;
  const avgScore =
    examCount > 0
      ? Math.round(
          examRecords.reduce((sum, r) => sum + r.score, 0) / examCount,
        )
      : 0;
  const bestScore = examCount > 0 ? Math.max(...examRecords.map((r) => r.score)) : 0;

  // 模拟卷与真题卷数量
  const mockPapers = EXAM_PAPERS.filter((p) => p.type === "mock");
  const realPapers = EXAM_PAPERS.filter((p) => p.type === "real");

  // 学霸笔记展示前 6 条
  const topNotes = EXPERT_NOTES.slice(0, 6);

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #3B76F7 0%, #3559E8 8%, #2D4CE3 16%, #EEF3FF 20%, #FFFFFF 25%)" }}>
      <header className="px-5 pt-6 pb-3">
        <BrushTitle size="lg" />
      </header>

      {/* 学霸笔记滚动新闻板 — 顶栏淡肉粉色，右侧淡鹅蛋黄，下方白色 */}
      <section className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{
              background: "linear-gradient(90deg, #FFE4E6 0%, #FFE4E6 60%, #FEF9C3 100%)",
              borderColor: "#FCE7F3",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Award size={14} color="#E11D48" />
              {/* "学霸" 黑色，"笔记" 红色 */}
              <span className="font-kai text-sm font-bold" style={{ color: "#000000" }}>学霸</span>
              <span className="font-kai text-sm font-bold" style={{ color: "#DC2626" }}>笔记</span>
              <span className="text-[10px] font-kai" style={{ color: "#9F1239" }}>
                ·2026专家考点·{EXPERT_NOTES.length}篇
              </span>
            </div>
            <button
              onClick={() => navigate("/app/notes")}
              className="flex items-center gap-0.5 text-[10px]"
              style={{ color: "#9F1239" }}
            >
              查看全部 <ChevronRight size={12} />
            </button>
          </div>

          <div className="px-3 py-2 space-y-1.5">
            {topNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/app/note/${n.id}`)}
                className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg transition-colors text-left"
                style={{ color: "#1F2937" }}
              >
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: "#FFE4E6", color: "#BE123C" }}
                >
                  {n.category}
                </span>
                <span className="font-kai truncate flex-1">{n.title}</span>
                <ChevronRight size={12} className="flex-shrink-0 opacity-30" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 超级考点速记 - 真实数据 */}
      <section className="px-5 mb-4">
        <h2 className="font-kai text-base font-bold text-navy-900 mb-2 flex items-center gap-1.5">
          <span className="seal-stamp text-[9px] px-1 py-0.5">考点</span>
          超级考点速记
        </h2>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Bookmark size={20} className="text-navy-500 mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{collected}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">收藏题目</span>
          </div>
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <CheckCircle2 size={20} className="text-navy-600 mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{mastered}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">已掌握</span>
          </div>
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Circle size={20} className="text-gold mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{unmastered}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">未掌握</span>
          </div>
        </div>
        {/* 考试统计 - 实时数据 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Flame size={20} className="text-gold-dark mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{examCount}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">考试次数</span>
          </div>
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Target size={20} className="text-navy-600 mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{avgScore}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">平均分</span>
          </div>
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Award size={20} className="text-gold-dark mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{bestScore}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">最高分</span>
          </div>
        </div>
      </section>

      {/* 全真模拟考试 — 浅薄荷绿底板 + 按钮浅黄到浅绿渐变 + 字黑色 */}
      <section className="px-5 mb-4">
        <button
          onClick={() => navigate("/app/papers?type=mock")}
          className="w-full relative overflow-hidden rounded-2xl p-4 text-left group transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #D1FADF 0%, #A7F3D0 100%)" }}
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />
          <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} color="#000000" />
              <span
                className="text-[9px] px-1 py-0.5 font-alibaba font-bold rounded"
                style={{ background: "#FFFFFF", color: "#000000" }}
              >
                模拟
              </span>
              <span className="text-[10px] font-alibaba" style={{ color: "#000000" }}>{mockPapers.length}套试卷</span>
            </div>
            <h3 className="font-alibaba font-bold text-2xl mb-1" style={{ color: "#000000" }}>全真模拟考试</h3>
            <p className="text-[11px] font-alibaba" style={{ color: "#000000", opacity: 0.7 }}>
              仿真实考 · 限时作答 · 智能判分
            </p>
            <div
              className="mt-3 inline-flex items-center gap-1 text-xs font-alibaba rounded-full px-3 py-1"
              style={{
                background: "linear-gradient(90deg, #FEF3C7 0%, #A7F3D0 100%)",
                color: "#000000",
              }}
            >
              选择试卷 <ChevronRight size={14} />
            </div>
          </div>
        </button>
      </section>

      {/* 真题考试（淡浅紫色 + 蓝紫色字）+ 资料库（淡浅橘色 + 黄橙色字） */}
      <section className="px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/app/papers?type=real")}
            className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(139,92,246,0.15)" }}>
              <Award size={18} color="#7C3AED" />
            </div>
            <h3 className="font-kai text-base font-bold mb-0.5" style={{ color: "#7C3AED" }}>真题考试</h3>
            <p className="text-[10px] font-kai" style={{ color: "#7C3AED", opacity: 0.6 }}>{realPapers.length}套·精准演练</p>
          </button>
          <button
            onClick={() => navigate("/app/notes?title=library")}
            className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(249,115,22,0.15)" }}>
              <Library size={18} color="#F59E0B" />
            </div>
            <h3 className="font-kai text-base font-bold mb-0.5" style={{ color: "#F59E0B" }}>资料库</h3>
            <p className="text-[10px] font-kai" style={{ color: "#F59E0B", opacity: 0.6 }}>重点知识点·各学科汇总</p>
          </button>
        </div>
      </section>
    </div>
  );
}
