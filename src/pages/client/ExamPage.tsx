import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, CheckCircle2, Circle, ChevronRight, FileText, Library, Award } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { NOTES, MASTERY_STATS } from "@/data/mock";
import { useStore } from "@/store/useStore";

export default function ExamPage() {
  const navigate = useNavigate();
  const { questions } = useStore();
  const [showAllNotes, setShowAllNotes] = useState(false);

  const collected = questions.filter((q) => q.collected).length;
  const mastered = questions.filter((q) => q.mastered).length;
  const unmastered = questions.length - mastered;

  return (
    <div className="min-h-full bg-paper bg-navy-radial">
      <header className="px-5 pt-6 pb-3">
        <BrushTitle size="lg" />
      </header>

      {/* 学霸笔记滚动新闻板 */}
      <section className="px-5 mb-4">
        <div className="ink-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gold/10 border-b border-gold/20">
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-gold-dark" />
              <span className="font-kai text-sm font-bold text-gold-dark">学霸笔记</span>
            </div>
            <button
              onClick={() => setShowAllNotes((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-gold-dark"
            >
              查看更多 <ChevronRight size={12} />
            </button>
          </div>

          <div className="h-[112px] overflow-hidden relative px-4 py-2">
            {!showAllNotes ? (
              <div className="notes-scroll space-y-3">
                {[...NOTES, ...NOTES].map((n, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-navy-500/15 text-navy-600 text-[10px] font-bold">
                      {n.category}
                    </span>
                    <span className="font-kai text-navy-900 truncate">{n.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {NOTES.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-2 text-xs">
                    <span className="flex-shrink-0 w-5 text-center text-[10px] text-navy-800/40 font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-navy-500/15 text-navy-600 text-[10px] font-bold">
                      {n.category}
                    </span>
                    <span className="font-kai text-navy-900">{n.title}</span>
                  </div>
                ))}
              </div>
            )}
            {!showAllNotes && (
              <>
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-paper-light to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-paper-light to-transparent pointer-events-none" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* 超级考点速记 */}
      <section className="px-5 mb-4">
        <h2 className="font-kai text-base font-bold text-navy-900 mb-2 flex items-center gap-1.5">
          <span className="seal-stamp text-[9px] px-1 py-0.5">考点</span>
          超级考点速记
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Bookmark size={20} className="text-navy-500 mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{collected || MASTERY_STATS.collected}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">收藏题目</span>
          </div>
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <CheckCircle2 size={20} className="text-navy-600 mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{mastered || MASTERY_STATS.mastered}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">已掌握</span>
          </div>
          <div className="ink-card rounded-2xl p-3 flex flex-col items-center">
            <Circle size={20} className="text-gold mb-1" />
            <span className="font-display text-2xl text-navy-900 leading-none">{unmastered || MASTERY_STATS.unmastered}</span>
            <span className="text-[10px] text-navy-800/50 mt-1">未掌握</span>
          </div>
        </div>
      </section>

      {/* 全真模拟考试 */}
      <section className="px-5 mb-4">
        <button
          onClick={() => navigate("/app/simulate?type=mock")}
          className="w-full relative overflow-hidden rounded-2xl p-4 text-left group"
          style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)" }}
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/15" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-white" />
              <span className="seal-stamp text-[9px] px-1 py-0.5 bg-white text-navy-700">模拟</span>
            </div>
            <h3 className="brush-title text-2xl text-white mb-1">全真模拟考试</h3>
            <p className="text-[11px] text-white/80 font-kai">
              仿真实考 · 限时作答 · 智能判分
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs text-white font-kai">
              进入考试 <ChevronRight size={14} />
            </div>
          </div>
        </button>
      </section>

      {/* 真题考试 + 预复习资料库 */}
      <section className="px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/app/simulate?type=real")}
            className="ink-card rounded-2xl p-4 text-left hover:border-navy-400/40 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-navy-100 flex items-center justify-center mb-2">
              <Award size={18} className="text-navy-700" />
            </div>
            <h3 className="font-kai text-base font-bold text-navy-900 mb-0.5">真题考试</h3>
            <p className="text-[10px] text-navy-800/50 font-kai">历年真题·精准演练</p>
          </button>
          <button
            onClick={() => navigate("/app/dashboard")}
            className="ink-card rounded-2xl p-4 text-left hover:border-navy-500/40 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-navy-500/15 flex items-center justify-center mb-2">
              <Library size={18} className="text-navy-600" />
            </div>
            <h3 className="font-kai text-base font-bold text-navy-900 mb-0.5">资料库</h3>
            <p className="text-[10px] text-navy-800/50 font-kai">预复习·重点汇总</p>
          </button>
        </div>
      </section>
    </div>
  );
}
