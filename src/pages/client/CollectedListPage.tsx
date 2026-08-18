﻿﻿﻿﻿﻿import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bookmark, Trash2, RotateCcw, BookX } from "lucide-react";
import { useStore } from "@/store/useStore";
import { SUBJECTS } from "@/data/textbooks";
import type { Subject } from "@/data/types";

export default function CollectedListPage() {
  const navigate = useNavigate();
  const { collectedQuestions, removeCollectedQuestion } = useStore();
  const [filter, setFilter] = useState<Subject | "all">("all");

  const filtered =
    filter === "all"
      ? collectedQuestions
      : collectedQuestions.filter((q) => q.subject === filter);

  const subjects = Array.from(new Set(collectedQuestions.map((q) => q.subject)));

  return (
    <div className="mobile-frame flex flex-col bg-white">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-kai text-sm font-bold text-navy-900 flex items-center gap-1.5">
            <Bookmark size={16} className="text-gold-dark" fill="currentColor" />
            我的收藏
          </h1>
          <p className="text-[10px] text-navy-800/50 font-kai mt-0.5">
            共 {collectedQuestions.length} 道收藏题
          </p>
        </div>
      </header>

      {subjects.length > 0 && (
        <div className="px-4 py-2 border-b border-navy-500/8 flex gap-1.5 overflow-x-auto scrollbar-hide bg-white z-20 sticky top-[65px]">
          <button
            onClick={() => setFilter("all")}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-kai transition-all ${
              filter === "all" ? "bg-navy-600 text-white" : "bg-navy-500/10 text-navy-800"
            }`}
          >
            全部
          </button>
          {subjects.map((s) => {
            const info = SUBJECTS[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-kai transition-all ${
                  filter === s ? "text-white" : "bg-navy-500/10 text-navy-800"
                }`}
                style={filter === s ? { background: info.color } : {}}
              >
                {info.name}
              </button>
            );
          })}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <BookX size={40} className="text-navy-500/30 mb-3" />
            <p className="font-kai text-sm text-navy-800/50">
              {collectedQuestions.length === 0 ? "还没有收藏题目" : "该学科暂无收藏"}
            </p>
            <p className="font-kai text-[11px] text-navy-800/40 mt-1">
              在做题时点击题干右上角的 bookmark 即可收藏
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => {
              const info = SUBJECTS[q.subject];
              return (
                <div
                  key={q.id}
                  className="ink-card rounded-2xl p-4"
                  style={{ borderLeft: `3px solid ${info.color}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: info.bgColor, color: info.color }}
                    >
                      {info.name}
                    </span>
                    <span className="text-[10px] text-navy-800/50 font-kai">
                      {q.type === "single"
                        ? "单选"
                        : q.type === "multiple"
                        ? "多选"
                        : q.type === "judge"
                        ? "判断"
                        : q.grade || ""}
                    </span>
                    {q.version && (
                      <span className="text-[10px] text-navy-800/40 font-kai truncate">
                        · {q.version}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() =>
                          navigate(
                            `/app/redo?source=collected&questionId=${encodeURIComponent(q.id)}`,
                          )
                        }
                        className="text-navy-600 hover:text-navy-900 p-1 rounded hover:bg-navy-500/10"
                        title="重做此题"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={() => removeCollectedQuestion(q.id)}
                        className="text-navy-800/30 hover:text-red-500 p-1"
                        title="取消收藏"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="font-kai text-sm text-navy-900 leading-relaxed mb-2 line-clamp-3">
                    {q.stem}
                  </p>

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-1 text-[11px] font-kai text-navy-800/70">
                      {q.options.slice(0, 4).map((opt, i) => (
                        <p key={i} className="truncate">
                          {opt}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
