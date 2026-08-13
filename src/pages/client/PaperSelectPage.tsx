import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Award, Clock, CheckCircle2 } from "lucide-react";
import { EXAM_PAPERS } from "@/data/examPapers";
import { useStore } from "@/store/useStore";

export default function PaperSelectPage() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") || "mock") as "mock" | "real";
  const navigate = useNavigate();
  const { examRecords } = useStore();

  const papers = EXAM_PAPERS.filter((p) => p.type === type);
  const isReal = type === "real";

  return (
    <div className="min-h-full bg-paper bg-navy-radial">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 sticky top-0 bg-paper-light/95 backdrop-blur z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-kai text-sm font-bold text-navy-900">
            {isReal ? "真题考试" : "全真模拟考试"}
          </h1>
          <p className="text-[10px] text-navy-800/50 font-kai">
            共{papers.length}套试卷 · 选择一套开始考试
          </p>
        </div>
        {isReal ? (
          <Award size={18} className="text-navy-700" />
        ) : (
          <FileText size={18} className="text-navy-700" />
        )}
      </header>

      <main className="px-4 py-4 space-y-3">
        {papers.map((paper, idx) => {
          // 查找该试卷的最近一次成绩
          const record = examRecords
            .filter((r) => r.paperId === paper.id)
            .sort((a, b) => b.completedAt - a.completedAt)[0];

          return (
            <button
              key={paper.id}
              onClick={() => navigate(`/app/simulate?paperId=${paper.id}`)}
              className="w-full ink-card rounded-2xl p-4 text-left hover:border-navy-400/40 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-xs text-navy-800/40 font-bold">
                      第{idx + 1}套
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        paper.difficulty === "基础"
                          ? "bg-navy-500/10 text-navy-700"
                          : paper.difficulty === "中等"
                          ? "bg-gold/15 text-gold-dark"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {paper.difficulty}
                    </span>
                  </div>
                  <h3 className="font-kai text-sm font-bold text-navy-900 mb-1">
                    {paper.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-navy-800/50 font-kai">
                    <span className="flex items-center gap-0.5">
                      <FileText size={11} />
                      {paper.questions.length}题
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={11} />
                      {paper.questions.length * 2}分钟
                    </span>
                  </div>
                </div>
                {record ? (
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <CheckCircle2 size={12} className="text-navy-600" />
                      <span className="text-[10px] text-navy-800/50 font-kai">已考</span>
                    </div>
                    <p className="font-display text-lg text-navy-700 font-bold leading-none mt-0.5">
                      {record.score}
                      <span className="text-[10px]">分</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <div className="px-2 py-1 rounded-lg bg-navy-500/10 text-navy-700 text-[10px] font-kai font-bold">
                      开始
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
