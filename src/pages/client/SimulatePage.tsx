import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, Award, RotateCcw, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { EXAM_PAPERS } from "@/data/examPapers";
import type { ExamQuestion } from "@/data/examPapers";
import { useStore } from "@/store/useStore";

// 评语生成
function getComment(score: number): { title: string; detail: string } {
  if (score >= 90)
    return {
      title: "金榜题名有望！",
      detail: "你对2026年中考核心考点掌握扎实，答题精准。继续保持，中考必胜！建议挑战拔高题，冲击满分。",
    };
  if (score >= 75)
    return {
      title: "再接再厉！",
      detail: "基础掌握较好，但仍有提升空间。重点复习错题涉及的考点，结合学霸笔记巩固薄弱环节。",
    };
  if (score >= 60)
    return {
      title: "继续努力！",
      detail: "已达到及格水平，但关键考点还需加强。建议系统复习课本基础概念，多做真题找规律。",
    };
  return {
    title: "需要加强复习",
    detail: "基础薄弱，建议回归课本，逐章梳理知识点。结合学霸笔记中的2026考点重点突破，循序渐进。",
  };
}

// 判断答案是否正确
function isCorrect(q: ExamQuestion, userAns: string[]): boolean {
  if (q.type === "multiple") {
    const correctAns = q.answer as string[];
    if (userAns.length !== correctAns.length) return false;
    const sortedUser = [...userAns].sort();
    const sortedCorrect = [...correctAns].sort();
    return sortedUser.every((v, i) => v === sortedCorrect[i]);
  }
  // single / judge
  return userAns.length === 1 && userAns[0] === q.answer;
}

export default function SimulatePage() {
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get("paperId");
  const navigate = useNavigate();
  const { recordExamResult } = useStore();

  const paper = useMemo(
    () => EXAM_PAPERS.find((p) => p.id === paperId),
    [paperId],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  // 统一用 string[] 存储答案：single/judge 长度为1，multiple 可多选
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  // 试卷不存在
  if (!paper) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-paper bg-navy-radial px-6">
        <p className="font-kai text-sm text-navy-800/60 mb-4">试卷不存在</p>
        <button
          onClick={() => navigate("/app/exam")}
          className="btn-navy px-4 py-2 rounded-xl font-kai text-sm"
        >
          返回备考冲刺
        </button>
      </div>
    );
  }

  const questions = paper.questions;
  const currentQ = questions[currentIndex];
  const totalTime = questions.length * 2; // 每题2分钟

  // 计算成绩
  const correctCount = questions.reduce(
    (acc, q, i) => acc + (isCorrect(q, answers[i] || []) ? 1 : 0),
    0,
  );
  const finalScore = Math.round((correctCount / questions.length) * 100);
  const comment = getComment(finalScore);

  // 选项点击处理
  const handleOptionClick = (opt: string) => {
    const cur = answers[currentIndex] || [];
    if (currentQ.type === "multiple") {
      // 多选：切换选中状态
      const next = cur.includes(opt)
        ? cur.filter((v) => v !== opt)
        : [...cur, opt];
      setAnswers({ ...answers, [currentIndex]: next });
    } else {
      // 单选/判断：直接替换
      setAnswers({ ...answers, [currentIndex]: [opt] });
    }
  };

  // 提交试卷
  const handleSubmit = () => {
    setSubmitted(true);
    recordExamResult({
      paperId: paper.id,
      title: paper.title,
      type: paper.type,
      score: finalScore,
      correctCount,
      totalQuestions: questions.length,
      completedAt: Date.now(),
    });
    window.scrollTo({ top: 0 });
  };

  // 答题完成数
  const answeredCount = Object.values(answers).filter(
    (a) => a && a.length > 0,
  ).length;

  // ===== 结果页 =====
  if (submitted) {
    return (
      <div className="min-h-full bg-paper bg-navy-radial">
        <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 sticky top-0 bg-paper-light/95 backdrop-blur z-30">
          <button onClick={() => navigate("/app/exam")} className="p-1 -ml-1">
            <ChevronLeft size={22} className="text-navy-900" />
          </button>
          <h1 className="font-kai text-sm font-bold text-navy-900">考试结果</h1>
        </header>

        <main className="px-5 py-5">
          {/* 成绩卡 */}
          <div className="ink-card rounded-3xl p-6 text-center mb-4 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gold/8" />
            <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-navy-600/6" />
            <div className="relative">
              <Award size={32} className="text-gold-dark mx-auto mb-2" />
              <p className="font-kai text-xs text-navy-800/60 mb-1">{paper.title}</p>
              <p className="font-display text-6xl text-navy-700 font-bold leading-none my-2">
                {finalScore}
                <span className="text-2xl">分</span>
              </p>
              <p className="font-kai text-xs text-navy-800/60">
                答对 {correctCount} / 共 {questions.length} 题
              </p>
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-navy-600/12 text-navy-700 text-xs font-kai font-bold">
                {comment.title}
              </div>
            </div>
          </div>

          {/* 评语 */}
          <div className="ink-card rounded-2xl p-4 mb-4 border-l-4 border-navy-500">
            <div className="flex items-start gap-2">
              <BookOpen size={16} className="text-navy-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-kai text-xs font-bold text-navy-900 mb-1">教师评语</p>
                <p className="font-kai text-xs text-navy-800/80 leading-relaxed">
                  {comment.detail}
                </p>
              </div>
            </div>
          </div>

          {/* 答题回顾 */}
          <h2 className="font-kai text-sm font-bold text-navy-900 mb-2">答题回顾</h2>
          <div className="space-y-2 mb-4">
            {questions.map((q, i) => {
              const userAns = answers[i] || [];
              const correct = isCorrect(q, userAns);
              const correctAns = Array.isArray(q.answer) ? q.answer : [q.answer];
              return (
                <div
                  key={q.id}
                  className={`ink-card rounded-xl p-3 border-l-4 ${
                    correct ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white ${
                        correct ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-kai text-xs text-navy-900 line-clamp-2 mb-1">
                        {i + 1}. {q.stem}
                      </p>
                      <p className={`text-[10px] font-kai ${correct ? "text-green-600" : "text-red-500"}`}>
                        你的答案：{userAns.length > 0 ? userAns.join("，") : "未作答"}
                      </p>
                      {!correct && (
                        <p className="text-[10px] font-kai text-green-600 mt-0.5">
                          正确答案：{correctAns.join("，")}
                        </p>
                      )}
                      {/* 解析 */}
                      <p className="text-[10px] text-navy-800/60 font-kai mt-1 leading-relaxed">
                        【解析】{q.analysis}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="px-5 py-3 border-t border-navy-500/10 bg-navy-50/60 sticky bottom-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setCurrentIndex(0);
              }}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
            >
              <RotateCcw size={14} />
              再考一次
            </button>
            <button
              onClick={() => navigate("/app/papers?type=" + paper.type)}
              className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
            >
              换套试卷
            </button>
            <button
              onClick={() => navigate("/app/exam")}
              className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
            >
              返回
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // ===== 答题页 =====
  const userAns = answers[currentIndex] || [];
  const isMultiple = currentQ.type === "multiple";

  return (
    <div className="min-h-full bg-paper bg-navy-radial flex flex-col">
      {/* 顶部 */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 bg-navy-50/60 backdrop-blur sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-kai text-sm font-bold text-navy-900 truncate">
            {paper.title}
          </h1>
          <p className="text-[10px] text-navy-800/60">
            第 {currentIndex + 1} / {questions.length} 题 · 已答 {answeredCount} 题
          </p>
        </div>
        <div className="flex items-center gap-1 text-gold-dark">
          <Clock size={14} />
          <span className="font-display text-sm font-bold">{totalTime}:00</span>
        </div>
      </header>

      {/* 进度条 */}
      <div className="h-1 bg-navy-500/10">
        <div
          className="h-full bg-navy-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm text-navy-900 font-bold">
            第 {currentIndex + 1} 题
          </span>
          <div className="flex items-center gap-2">
            <span className="seal-stamp text-[9px] px-1.5 py-0.5">
              {currentQ.type === "single"
                ? "单选"
                : currentQ.type === "multiple"
                ? "多选"
                : "判断"}
            </span>
            {isMultiple && (
              <span className="text-[10px] text-gold-dark font-kai">可多选</span>
            )}
          </div>
        </div>

        {/* 题干 */}
        <div className="ink-card rounded-2xl p-4 mb-4">
          <p className="font-kai text-base text-navy-900 leading-relaxed">
            {currentQ.stem}
          </p>
        </div>

        {/* 选项 */}
        <div className="space-y-2">
          {currentQ.options.map((opt) => {
            const isSelected = userAns.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => handleOptionClick(opt)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "bg-navy-500/8 border-navy-500/50"
                    : "bg-navy-50/40 border-navy-500/10"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isSelected ? "bg-navy-600 text-paper" : "bg-navy-500/10 text-navy-900"
                  }`}
                >
                  {opt.charAt(0)}
                </span>
                <span className="flex-1 font-kai text-sm text-navy-900">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* 答题卡 */}
        <div className="mt-5">
          <p className="text-[10px] text-navy-800/50 font-kai mb-2">答题卡</p>
          <div className="grid grid-cols-8 gap-1.5">
            {questions.map((_, i) => {
              const answered = answers[i] && answers[i].length > 0;
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`aspect-square rounded-lg text-[10px] font-bold font-kai transition-all ${
                    isCurrent
                      ? "bg-navy-600 text-paper"
                      : answered
                      ? "bg-navy-500/20 text-navy-700"
                      : "bg-navy-500/5 text-navy-800/40"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="px-5 py-3 border-t border-navy-500/10 bg-navy-50/60 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="px-4 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
            >
              上一题
            </button>
          )}
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className={`flex-1 py-3 rounded-xl font-kai text-sm font-bold transition-all ${
                answeredCount >= questions.length
                  ? "btn-navy"
                  : "bg-navy-500/10 text-navy-800/40"
              }`}
            >
              提交试卷 ({answeredCount}/{questions.length})
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
