import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, Award, RotateCcw } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function SimulatePage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "mock";
  const isReal = type === "real";
  const navigate = useNavigate();
  const { questions } = useStore();

  const examQuestions = questions.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentQ = examQuestions[currentIndex];
  const totalTime = examQuestions.length * 2; // 每题2分钟

  const score = submitted
    ? examQuestions.reduce((acc, q, i) => {
        const a = answers[i];
        const correct = Array.isArray(q.answer) ? q.answer.includes(a) : q.answer === a;
        return acc + (correct ? 1 : 0);
      }, 0)
    : 0;

  const finalScore = Math.round((score / examQuestions.length) * 100);

  if (submitted) {
    return (
      <div className="mobile-frame flex flex-col bg-paper bg-navy-radial">
        <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10">
          <button onClick={() => navigate("/app/exam")} className="p-1 -ml-1">
            <ChevronLeft size={22} className="text-navy-900" />
          </button>
          <h1 className="font-kai text-sm font-bold text-navy-900">考试结果</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6">
          {/* 成绩卡 */}
          <div className="ink-card rounded-3xl p-6 text-center mb-4 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gold/8" />
            <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-navy-600/6" />
            <div className="relative">
              <Award size={32} className="text-gold-dark mx-auto mb-2" />
              <p className="font-kai text-xs text-navy-800/60 mb-1">
                {isReal ? "真题考试" : "全真模拟"}
              </p>
              <p className="font-display text-6xl text-navy-700 font-bold leading-none my-2">
                {finalScore}
                <span className="text-2xl">分</span>
              </p>
              <p className="font-kai text-xs text-navy-800/60">
                答对 {score} / 共 {examQuestions.length} 题
              </p>
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-navy-600/12 text-navy-700 text-xs font-kai">
                {finalScore >= 80 ? "金榜题名有望！" : finalScore >= 60 ? "再接再厉！" : "继续加油！"}
              </div>
            </div>
          </div>

          {/* 答题回顾 */}
          <h2 className="font-kai text-sm font-bold text-navy-900 mb-2">答题回顾</h2>
          <div className="space-y-2">
            {examQuestions.map((q, i) => {
              const a = answers[i];
              const correct = Array.isArray(q.answer) ? q.answer.includes(a) : q.answer === a;
              return (
                <div
                  key={q.id}
                  className={`ink-card rounded-xl p-3 border-l-4 ${
                    correct ? "border-navy-600" : "border-gold"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-paper ${
                        correct ? "bg-navy-600" : "bg-gold"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-kai text-xs text-navy-900 line-clamp-2">{q.stem}</p>
                      <p className="text-[10px] text-navy-800/60 mt-1">
                        你的答案：{a || "未作答"} · 正确答案：{Array.isArray(q.answer) ? q.answer.join(",") : q.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="px-5 py-3 border-t border-navy-500/10 bg-navy-50/60 pb-[calc(12px+env(safe-area-inset-bottom))]">
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
              onClick={() => navigate("/app/dashboard")}
              className="flex-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
            >
              查看学情
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="mobile-frame flex flex-col bg-paper bg-navy-radial">
      {/* 顶部 */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 bg-navy-50/60 backdrop-blur sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-kai text-sm font-bold text-navy-900">
            {isReal ? "真题考试" : "全真模拟考试"}
          </h1>
          <p className="text-[10px] text-navy-800/60">共 {examQuestions.length} 题</p>
        </div>
        <div className="flex items-center gap-1 text-gold-dark">
          <Clock size={14} />
          <span className="font-display text-sm font-bold">{totalTime}:00</span>
        </div>
      </header>

      {/* 进度 */}
      <div className="h-1 bg-navy-500/10">
        <div
          className="h-full bg-navy-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm text-navy-900 font-bold">
            第 {currentIndex + 1} 题
          </span>
          <span className="text-[10px] text-navy-800/60">
            剩余 {examQuestions.length - currentIndex - 1} 题
          </span>
        </div>

        {/* 题干 */}
        <div className="ink-card rounded-2xl p-4 mb-4">
          <span className="seal-stamp text-[9px] px-1.5 py-0.5 mb-2 inline-block">
            {currentQ.type === "single" ? "单选" : currentQ.type === "multiple" ? "多选" : "判断"}
          </span>
          <p className="font-kai text-base text-navy-900 leading-relaxed">{currentQ.stem}</p>
        </div>

        {/* 选项 */}
        <div className="space-y-2">
          {currentQ.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = answers[currentIndex] === opt;
            return (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [currentIndex]: opt })}
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
                  {letter}
                </span>
                <span className="flex-1 font-kai text-sm text-navy-900">{opt}</span>
              </button>
            );
          })}
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
          {currentIndex < examQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={!answers[currentIndex]}
              className={`flex-1 py-3 rounded-xl font-kai text-sm font-bold transition-all ${
                answers[currentIndex] ? "btn-navy" : "bg-navy-500/10 text-navy-800/40"
              }`}
            >
              下一题
            </button>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < examQuestions.length}
              className={`flex-1 py-3 rounded-xl font-kai text-sm font-bold transition-all ${
                Object.keys(answers).length >= examQuestions.length
                  ? "btn-navy"
                  : "bg-navy-500/10 text-navy-800/40"
              }`}
            >
              提交试卷
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
