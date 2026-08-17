﻿﻿﻿﻿﻿import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, BookX, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { SUBJECTS } from "@/data/textbooks";
import type { Subject } from "@/data/types";

export default function ErrorBookPage() {
  const navigate = useNavigate();
  const { errorBook, questions, removeFromErrorBook } = useStore();
  const [filter, setFilter] = useState<Subject | "all">("all");

  const filtered = filter === "all" ? errorBook : errorBook.filter((e) => e.subject === filter);

  const getQuestion = (id: string) => questions.find((q) => q.id === id);

  const subjects = Array.from(new Set(errorBook.map((e) => e.subject)));

  return (
    <div className="mobile-frame flex flex-col bg-white">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-kai text-sm font-bold text-navy-900 flex items-center gap-1.5">
            <BookX size={16} className="text-navy-600" />
            错题本
          </h1>
          <p className="text-[10px] text-navy-800/50 font-kai mt-0.5">共 {errorBook.length} 道错题</p>
        </div>
      </header>

      {/* 学科筛选：纯白背景，文字清晰可读 */}
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
            <CheckCircle2 size={40} className="text-emerald-500/40 mb-3" />
            <p className="font-kai text-sm text-navy-800/50">
              {errorBook.length === 0 ? "还没有错题，继续保持！" : "该学科暂无错题"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const q = getQuestion(item.questionId);
              const info = SUBJECTS[item.subject];
              // 兼容：选择题从 q 读，大题从 item 本身读
              const stem = item.stem || q?.stem || "";
              const version = item.version || q?.version || "";
              // 优先用 item.type 判断题型，避免考试错题因 questionId 不匹配而误标为大题
              const itemType = item.type || q?.type;
              const isEssay = itemType === "essay" || (!itemType && !q);
              // 选择题：优先取错题本里存的"对应错因"和"正确思路"
              const wrongReason = item.wrongReason;
              const rightThought = item.rightThought || item.analysis || q?.analysis || "";
              return (
                <div
                  key={item.id || item.questionId}
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
                    {isEssay && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                        style={{ background: info.color }}
                      >
                        大题
                      </span>
                    )}
                    {!isEssay && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-navy-500/10 text-navy-800">
                        选择判断题
                      </span>
                    )}
                    <span className="text-[10px] text-navy-800/40 font-kai">{version}</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() =>
                          navigate(
                            `/app/redo?source=errorbook&questionId=${encodeURIComponent(item.questionId)}${filter !== "all" ? `&subject=${filter}` : ""}`,
                          )
                        }
                        className="text-navy-600 hover:text-navy-900 p-1 rounded hover:bg-navy-500/10"
                        title="重做此题"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={() => removeFromErrorBook(item.questionId)}
                        className="text-navy-800/30 hover:text-red-500 p-1"
                        title="移出错题本"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="font-kai text-sm text-navy-900 leading-relaxed mb-3 whitespace-pre-wrap">{stem}</p>

                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-kai text-red-600 font-bold flex-shrink-0 mt-0.5 flex items-center gap-0.5">
                        <XCircle size={11} />
                        错答
                      </span>
                      <span className="text-xs font-kai text-red-600 bg-red-50 px-2 py-0.5 rounded-md whitespace-pre-wrap break-all">
                        {item.selectedAnswer}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-kai text-emerald-700 font-bold flex-shrink-0 mt-0.5 flex items-center gap-0.5">
                        <CheckCircle2 size={11} />
                        正确
                      </span>
                      <span className="text-xs font-kai text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md whitespace-pre-wrap break-all">
                        {item.correctAnswer}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-navy-500/8 space-y-2">
                    {/* 选择/判断题展示对应错因 */}
                    {wrongReason && (
                      <div>
                        <p className="text-[10px] font-kai text-red-700 font-bold mb-1 flex items-center gap-1">
                          <XCircle size={11} />
                          错题解析
                        </p>
                        <p className="font-kai text-[11px] text-red-700/90 leading-relaxed whitespace-pre-wrap">
                          {wrongReason}
                        </p>
                      </div>
                    )}
                    {/* 正确思路 */}
                    <div>
                      <p className="text-[10px] font-kai text-emerald-700 font-bold mb-1 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        正确思路
                      </p>
                      <p className="font-kai text-[11px] text-navy-800/70 leading-relaxed whitespace-pre-wrap">
                        {rightThought}
                      </p>
                    </div>
                    {item.solution && (
                      <p className="font-kai text-[11px] text-navy-800/70 leading-relaxed whitespace-pre-wrap mt-2 pt-2 border-t border-navy-500/8">
                        <span className="text-emerald-700 font-bold">推荐解题思路：</span>
                        {item.solution}
                      </p>
                    )}
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
