﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Check, Trash2 } from "lucide-react";
import { useStore, type ErrorBookItem } from "@/store/useStore";
import type { Question } from "@/data/types";

// 统一题目视图：错题本条目或收藏题
interface RedoView {
  questionId: string;
  stem: string;
  options: string[];
  // 正确答案文本集合（用于判定）
  correctTexts: string[];
  // 大题：完整正确答案文本
  correctAnswerText?: string;
  // 大题：推荐解题思路
  solution?: string;
  analysis?: string;
  type?: "single" | "multiple" | "judge" | "essay";
}

// 将错题条目转为统一视图
function fromErrorItem(it: ErrorBookItem): RedoView {
  const opts = it.options || [];
  const isEssay = it.type === "essay";
  // 大题：直接存完整答案文本
  if (isEssay) {
    return {
      questionId: it.questionId,
      stem: it.stem || "(题目内容已丢失)",
      options: [],
      correctTexts: [],
      correctAnswerText: it.correctAnswer,
      solution: it.solution,
      analysis: it.rightThought || it.analysis,
      type: "essay",
    };
  }
  // ponytail: 同时按 顿号(、)、全角逗号(，)、半角逗号(,) 分割，兼容多选题答案的存储格式
  const correctTexts = (it.correctAnswer || "")
    .split(/[、，,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      // 练习来源：correctAnswer 已转为选项文本（如"贝尔"），直接用
      // 考试来源：correctAnswer 可能是字母（如"B"）或带前缀文本（如"B. 贝尔"），需归一化
      const letter = s.toUpperCase();
      if (letter.length === 1 && letter >= "A" && letter <= "Z" && opts[letter.charCodeAt(0) - 65]) {
        return opts[letter.charCodeAt(0) - 65];
      }
      return s;
    });
  return {
    questionId: it.questionId,
    stem: it.stem || "(题目内容已丢失)",
    options: opts,
    correctTexts,
    analysis: it.rightThought || it.analysis,
    type: it.type,
  };
}

// 将收藏题转为统一视图
function fromCollected(q: Question): RedoView {
  // 大题
  if (q.type === "essay") {
    const ans = Array.isArray(q.answer) ? q.answer.join("；") : q.answer;
    return {
      questionId: q.id,
      stem: q.stem,
      options: [],
      correctTexts: [],
      correctAnswerText: ans,
      solution: q.solution,
      analysis: q.analysis,
      type: "essay",
    };
  }
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get("source") || "errorbook";
  const questionId = searchParams.get("questionId") || "";
  const subjectFilter = searchParams.get("subject") || "";

  const { errorBook, collectedQuestions, removeFromErrorBook, removeCollectedQuestion, currentClientCode } = useStore();

  // ponytail: 按账号隔离，仅展示当前账号的错题
  const myErrorBook = useMemo(
    () => errorBook.filter((e) => (e.clientCode || undefined) === (currentClientCode || undefined)),
    [errorBook, currentClientCode],
  );

  // 当前题在列表中的位置（用于"下一题"）
  const list = useMemo(() => {
    if (source === "collected") {
      return collectedQuestions;
    }
    return subjectFilter
      ? myErrorBook.filter((e) => e.subject === subjectFilter)
      : myErrorBook;
  }, [source, subjectFilter, myErrorBook, collectedQuestions]);

  const currentIndexInList = useMemo(
    () => list.findIndex((item) =>
      source === "collected"
        ? (item as Question).id === questionId
        : (item as ErrorBookItem).questionId === questionId,
    ),
    [list, questionId, source],
  );

  const hasPrev = currentIndexInList > 0;
  const hasNext = currentIndexInList >= 0 && currentIndexInList < list.length - 1;

  const view: RedoView | null = useMemo(() => {
    if (source === "collected") {
      const q = collectedQuestions.find((c) => c.id === questionId);
      return q ? fromCollected(q) : null;
    }
    const it = myErrorBook.find((e) => e.questionId === questionId);
    return it ? fromErrorItem(it) : null;
  }, [source, questionId, myErrorBook, collectedQuestions]);

  const [selected, setSelected] = useState<string[]>([]);
  const [essayAnswer, setEssayAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // 切换题目时重置作答状态
  useEffect(() => {
    setSelected([]);
    setEssayAnswer("");
    setSubmitted(false);
  }, [questionId]);

  if (!view) {
    return (
      <div className="min-h-full bg-white flex flex-col">
        <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 bg-white">
          <button onClick={() => navigate("/app/home")} className="p-1 -ml-1">
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

  const isEssay = view.type === "essay";
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
    if (isEssay) {
      if (!essayAnswer.trim()) return;
    } else {
      if (selected.length === 0) return;
    }
    setSubmitted(true);
  };

  // 判定：选择题所选每项都必须在正确集合中，且数量一致；大题不自动判分
  const isCorrect = !isEssay && submitted &&
    selected.length === correctSet.size &&
    selected.every((s) => correctSet.has(s));

  const handleRemove = () => {
    if (source === "collected") {
      removeCollectedQuestion(questionId);
    } else {
      removeFromErrorBook(questionId);
    }
    // 删除后优先跳到下一题，没有则返回列表
    const nextIdx = source === "collected" ? currentIndexInList : currentIndexInList;
    const remaining = list.filter((_, i) => i !== currentIndexInList);
    if (remaining.length > 0) {
      const targetIdx = Math.min(nextIdx, remaining.length - 1);
      const item = remaining[targetIdx];
      const nextId = source === "collected"
        ? (item as Question).id
        : (item as ErrorBookItem).questionId;
      setSelected([]);
      setEssayAnswer("");
      setSubmitted(false);
      setSearchParams({
        source,
        questionId: nextId,
        ...(subjectFilter ? { subject: subjectFilter } : {}),
      });
    } else {
      navigate(source === "collected" ? "/app/collected" : "/app/error-book");
    }
  };

  const handleRedo = () => {
    setSelected([]);
    setEssayAnswer("");
    setSubmitted(false);
  };

  const goToIndex = (idx: number) => {
    const item = list[idx];
    if (!item) return;
    const nextId = source === "collected"
      ? (item as Question).id
      : (item as ErrorBookItem).questionId;
    setSelected([]);
    setSubmitted(false);
    setSearchParams({
      source,
      questionId: nextId,
      ...(subjectFilter ? { subject: subjectFilter } : {}),
    });
  };

  return (
    <div className="min-h-full bg-white flex flex-col">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 bg-white sticky top-0 z-30">
        <button onClick={() => navigate("/app/home")} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-kai text-sm font-bold text-navy-900 truncate">
            {source === "collected" ? "收藏重做" : "错题重做"}
          </h1>
          <p className="text-[10px] text-navy-800/60">
            {isEssay ? "大题" : view.type === "single" ? "单选题" : view.type === "multiple" ? "多选题" : "判断题"}
            {isMultiple && " · 可多选"}
          </p>
        </div>
        {currentIndexInList >= 0 && list.length > 1 && (
          <span className="text-[10px] text-navy-800/50 font-kai flex-shrink-0">
            {currentIndexInList + 1}/{list.length}
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* 题干 */}
        <div className="ink-card rounded-2xl p-4 mb-4">
          <p className="font-kai text-base text-navy-900 leading-relaxed">{view.stem}</p>
        </div>

        {/* 大题：文本输入 */}
        {isEssay ? (
          <div>
            <textarea
              value={essayAnswer}
              onChange={(e) => !submitted && setEssayAnswer(e.target.value)}
              disabled={submitted}
              placeholder="请在此输入你的答案…"
              className="w-full min-h-[160px] p-3 rounded-xl border-2 border-navy-500/15 font-kai text-sm text-navy-900 leading-relaxed resize-none focus:outline-none focus:border-navy-500/50 disabled:bg-navy-50/30"
            />
          </div>
        ) : (
          /* 选择题选项 */
          <div className="space-y-2">
            {view.options.map((opt, idx) => {
              const isSelected = selected.includes(opt);
              const isCorrectOpt = correctSet.has(opt);
              const label = String.fromCharCode(65 + idx);
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
                    {label}
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
        )}

        {/* 结果与解析 */}
        {submitted && (
          <div className="mt-4 space-y-2">
            {/* 大题：展示你的作答 + 参考答案 */}
            {isEssay ? (
              <>
                <div className="p-3 rounded-xl bg-navy-50/40 border border-navy-500/15">
                  <p className="font-kai text-[10px] font-bold text-navy-700 mb-1">你的答案</p>
                  <p className="font-kai text-xs text-navy-800/85 leading-relaxed whitespace-pre-wrap">
                    {essayAnswer || "（未作答）"}
                  </p>
                </div>
                {view.correctAnswerText && (
                  <div className="p-3 rounded-xl bg-green-50/60 border border-green-200">
                    <p className="font-kai text-[10px] font-bold text-green-700 mb-1">参考答案</p>
                    <p className="font-kai text-xs text-green-700/90 leading-relaxed whitespace-pre-wrap">
                      {view.correctAnswerText}
                    </p>
                  </div>
                )}
                {view.solution && (
                  <div className="p-3 rounded-xl bg-white border border-navy-500/15">
                    <p className="font-kai text-[10px] font-bold text-navy-700 mb-1">【推荐解题思路】</p>
                    <p className="font-kai text-xs text-navy-800/85 leading-relaxed whitespace-pre-wrap">
                      {view.solution}
                    </p>
                  </div>
                )}
                {view.analysis && !view.solution && (
                  <div className="p-3 rounded-xl bg-white border border-navy-500/15">
                    <p className="font-kai text-[10px] font-bold text-navy-700 mb-1">【解析】</p>
                    <p className="font-kai text-xs text-navy-800/85 leading-relaxed whitespace-pre-wrap">
                      {view.analysis}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* 选择题：对错判定 + 解析 */
              <>
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
              </>
            )}
          </div>
        )}
      </main>

      <footer className="px-4 py-3 border-t border-navy-500/10 bg-white pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          {!submitted ? (
            <>
              {hasPrev && (
                <button
                  onClick={() => goToIndex(currentIndexInList - 1)}
                  className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
                >
                  <ChevronLeft size={14} />
                  上一题
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isEssay ? !essayAnswer.trim() : selected.length === 0}
                className={`flex-1 py-3 rounded-xl font-kai text-sm font-bold ${
                  (isEssay ? !essayAnswer.trim() : selected.length === 0)
                    ? "bg-navy-500/15 text-navy-800/40"
                    : "btn-navy"
                }`}
              >
                提交答案
              </button>
              {hasNext && (
                <button
                  onClick={() => goToIndex(currentIndexInList + 1)}
                  className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
                >
                  跳过
                  <ChevronRight size={14} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleRedo}
                className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
              >
                <RotateCcw size={14} />
                再做
              </button>
              {(isCorrect || isEssay) && source === "errorbook" && (
                <button
                  onClick={handleRemove}
                  className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl bg-green-500/15 text-green-700 font-kai text-sm font-bold"
                >
                  <Check size={14} />
                  已掌握
                </button>
              )}
              {source === "collected" && (
                <button
                  onClick={handleRemove}
                  className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl bg-red-500/10 text-red-600 font-kai text-sm font-bold"
                >
                  <Trash2 size={14} />
                  取消收藏
                </button>
              )}
              {hasNext ? (
                <button
                  onClick={() => goToIndex(currentIndexInList + 1)}
                  className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold flex items-center justify-center gap-1"
                >
                  下一题
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/app/home")}
                  className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
                >
                  返回首页
                </button>
              )}
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
