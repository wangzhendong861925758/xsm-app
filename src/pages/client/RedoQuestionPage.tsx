import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw, Check, Trash2 } from "lucide-react";
import { useStore, type ErrorBookItem } from "@/store/useStore";
import type { Question } from "@/data/types";

// 统一题目视图：错题本条目或收藏题
interface RedoView {
  questionId: string;
  stem: string;
  options: string[];
  // 正确答案文本集合（用于判定）
  correctTexts: string[];
  analysis?: string;
  type?: "single" | "multiple" | "judge";
}

// 将错题条目转为统一视图
function fromErrorItem(it: ErrorBookItem): RedoView {
  const correctTexts = (it.correctAnswer || "")
    .split(/[，,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    questionId: it.questionId,
    stem: it.stem || "(题目内容已丢失)",
    options: it.options || [],
    correctTexts,
    analysis: it.rightThought || it.analysis,
    type: it.type,
  };
}

// 将收藏题转为统一视图
function fromCollected(q: Question): RedoView {
  const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
  // 兼容字母答案与文本答案
  const correctTexts = ans
    .map((a) => {
      if (typeof a !== "string") return "";
      const letter = a.trim().toUpperCase();
      if (letter.length === 1 && letter >= "A" && letter <= "Z") {
        const idx = letter.charCodeAt(0) - 65;
        return q.options?.[idx] || letter;
      }
      // 判断题：对/错、√/×
      if (/[对√]/.test(a)) return q.options?.[0] || "对";
      if (/[错×]/.test(a)) return q.options?.[1] || "错";
      return a;
    })
    .filter(Boolean);
  return {
    questionId: q.id,
    stem: q.stem,
    options: q.options || [],
    correctTexts,
    analysis: q.analysis,
    type: q.type as RedoView["type"],
  };
}

export default function RedoQuestionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get("source") || "errorbook";
  const questionId = searchParams.get("questionId") || "";

  const { errorBook, collectedQuestions, removeFromErrorBook, removeCollectedQuestion } = useStore();

  const view: RedoView | null = useMemo(() => {
    if (source === "collected") {
      const q = collectedQuestions.find((c) => c.id === questionId);
      return q ? fromCollected(q) : null;
    }
    const it = errorBook.find((e) => e.questionId === questionId);
    return it ? fromErrorItem(it) : null;
  }, [source, questionId, errorBook, collectedQuestions]);

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!view) {
    return (
      <div className="min-h-full bg-white flex flex-col">
        <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 bg-white">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ChevronLeft size={22} className="text-navy-900" />
          </button>
          <h1 className="font-kai text-sm font-bold text-navy-900">重做题目</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="font-kai text-sm text-navy-800/60">题目不存在或已被删除。</p>
        </main>
      </div>
    );
  }

  const isMultiple = view.type === "multiple";
  const correctSet = new Set(view.correctTexts);

  const handleOptionClick = (opt: string) => {
    if (submitted) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
      );
    } else {
      setSelected([opt]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    setSubmitted(true);
  };

  // 判定：所选每项都必须在正确集合中，且数量一致
  const isCorrect =
    submitted &&
    selected.length === correctSet.size &&
    selected.every((s) => correctSet.has(s));

  const handleRemove = () => {
    if (source === "collected") {
      removeCollectedQuestion(questionId);
      navigate("/app/collected");
    } else {
      removeFromErrorBook(questionId);
      navigate("/app/error-book");
    }
  };

  const handleRedo = () => {
    setSelected([]);
    setSubmitted(false);
  };

  return (
    <div className="min-h-full bg-white flex flex-col">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 bg-white sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-kai text-sm font-bold text-navy-900 truncate">
            {source === "collected" ? "收藏重做" : "错题重做"}
          </h1>
          <p className="text-[10px] text-navy-800/60">
            {view.type === "single" ? "单选题" : view.type === "multiple" ? "多选题" : "判断题"}
            {isMultiple && " · 可多选"}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* 题干 */}
        <div className="ink-card rounded-2xl p-4 mb-4">
          <p className="font-kai text-base text-navy-900 leading-relaxed">{view.stem}</p>
        </div>

        {/* 选项 */}
        <div className="space-y-2">
          {view.options.map((opt) => {
            const isSelected = selected.includes(opt);
            const isCorrectOpt = correctSet.has(opt);
            let cls = "bg-navy-50/40 border-navy-500/10";
            if (submitted) {
              if (isCorrectOpt) cls = "bg-green-50/60 border-green-500";
              else if (isSelected) cls = "bg-red-50/60 border-red-500";
            } else if (isSelected) {
              cls = "bg-navy-500/8 border-navy-500/50";
            }
            return (
              <button
                key={opt}
                onClick={() => handleOptionClick(opt)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${cls}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isSelected ? "bg-navy-600 text-paper" : "bg-navy-500/10 text-navy-900"
                  }`}
                >
                  {opt.charAt(0)}
                </span>
                <span className="flex-1 font-kai text-sm text-navy-900">{opt}</span>
                {submitted && isCorrectOpt && (
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                )}
                {submitted && isSelected && !isCorrectOpt && (
                  <XCircle size={16} className="text-red-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* 结果与解析 */}
        {submitted && (
          <div className="mt-4 space-y-2">
            <div
              className={`p-3 rounded-xl border ${
                isCorrect
                  ? "bg-green-50/60 border-green-200"
                  : "bg-red-50/60 border-red-200"
              }`}
            >
              <p
                className={`font-kai text-sm font-bold flex items-center gap-1.5 ${
                  isCorrect ? "text-green-700" : "text-red-600"
                }`}
              >
                {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {isCorrect ? "回答正确！" : "回答错误，再接再厉"}
              </p>
              {!isCorrect && (
                <p className="font-kai text-xs text-green-700 mt-1">
                  正确答案：{view.correctTexts.join("，")}
                </p>
              )}
            </div>
            {view.analysis && (
              <div className="p-3 rounded-xl bg-white border border-navy-500/15">
                <p className="font-kai text-[10px] font-bold text-navy-700 mb-1">【解析】</p>
                <p className="font-kai text-xs text-navy-800/85 leading-relaxed">
                  {view.analysis}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="px-4 py-3 border-t border-navy-500/10 bg-white pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selected.length === 0}
              className={`flex-1 py-3 rounded-xl font-kai text-sm font-bold ${
                selected.length === 0
                  ? "bg-navy-500/15 text-navy-800/40"
                  : "btn-navy"
              }`}
            >
              提交答案
            </button>
          ) : (
            <>
              <button
                onClick={handleRedo}
                className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
              >
                <RotateCcw size={14} />
                再做一次
              </button>
              {isCorrect && source === "errorbook" && (
                <button
                  onClick={handleRemove}
                  className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-green-500/15 text-green-700 font-kai text-sm font-bold"
                >
                  <Check size={14} />
                  已掌握，移出错题本
                </button>
              )}
              {source === "collected" && (
                <button
                  onClick={handleRemove}
                  className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 font-kai text-sm font-bold"
                >
                  <Trash2 size={14} />
                  取消收藏
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
              >
                返回列表
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
