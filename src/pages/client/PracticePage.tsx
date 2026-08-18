﻿﻿﻿import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Star, CheckCircle2, XCircle,
  RotateCcw, Shuffle, Grid3x3, Plus, Check,
} from "lucide-react";
import { SUBJECTS, getTextbook } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import type { Subject, Question } from "@/data/types";
import { shuffle, randomInRange } from "@/lib/utils";
import { fetchVersions } from "@/lib/api";

// 每次刷题题目数量范围（15-20 道随机）
const MIN_QUESTIONS = 15;
const MAX_QUESTIONS = 20;

function randomSessionCount(): number {
  return randomInRange(MIN_QUESTIONS, MAX_QUESTIONS);
}

// 每题作答状态
type QStatus = "unanswered" | "correct" | "wrong";

export default function PracticePage() {
  const { subject = "biology" } = useParams<{ subject: string }>();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version") || "";
  // 课时标题，用于按课时过滤题目（如 "第1课时 奏响中学序曲"）
  const lessonTitle = searchParams.get("lesson") || "";
  const navigate = useNavigate();
  const {
    questions,
    selectedGrade,
    toggleCollect,
    toggleMastered,
    incrementTodayLearned,
    recordTodayAnswer,
    answeredHistory,
    addAnsweredQuestion,
    resetAnsweredBySubjectVersion,
    errorBook,
    addToErrorBook,
    loadQuestions,
    questionsLoading,
  } = useStore();

  const subjectKey = subject as Subject;
  const info = SUBJECTS[subjectKey];
  const tb = getTextbook(selectedGrade, subjectKey);

  const [sessionCount, setSessionCount] = useState(() => randomSessionCount());
  const [collectToast, setCollectToast] = useState<{ show: boolean; text: string }>({ show: false, text: "" });
  const collectToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCollectToast = (collected: boolean) => {
    if (collectToastTimer.current) clearTimeout(collectToastTimer.current);
    setCollectToast({ show: true, text: collected ? "⭐ 已收藏" : "已取消收藏" });
    collectToastTimer.current = setTimeout(() => setCollectToast({ show: false, text: "" }), 1500);
  };

  // 按需加载题目分片
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let v = version;
      if (!v) {
        // 版本未指定时，取该学科年级下第一个版本
        const versions = await fetchVersions(subjectKey, selectedGrade);
        v = versions[0]?.version || "";
      }
      if (v && !cancelled) loadQuestions(subjectKey, selectedGrade, v);
    })();
    return () => { cancelled = true; };
  }, [subjectKey, selectedGrade, version, loadQuestions]);

  useEffect(() => {
    setSessionCount(randomSessionCount());
  }, [subjectKey, version]);

  const versionQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.subject !== subjectKey) return false;
      if (q.grade !== selectedGrade) return false;
      // 版本匹配：管理端未指定版本时匹配所有，客户端未选版本时也匹配所有
      if (q.version && version && q.version !== version) return false;
      // 选择判断题训练：排除大题
      if (q.type === "essay") return false;
      // 若指定了课时标题，则按 section 过滤；未指定则取该版本全部选择判断题
      if (lessonTitle && q.section && q.section !== lessonTitle) return false;
      return true;
    });
  }, [questions, subjectKey, selectedGrade, version, lessonTitle]);

  // 本轮题目：仅在进入页面/切换学科版本时计算一次，作答过程中不重新洗牌
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, { selected: string; status: QStatus }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCard, setShowCard] = useState(false); // 答题卡弹窗
  const [showResult, setShowResult] = useState(false); // 结算页
  // 用 ref 记录本次会话的 key，仅当学科/版本/数量变化时才重新生成题目
  const sessionKeyRef = useRef("");
  // 再练一轮触发器：递增以强制 useEffect 重新生成题目
  const [restartTrigger, setRestartTrigger] = useState(0);

  // 进入页面或切换学科/版本时，生成本轮题目（只计算一次，作答过程中不重算）
  useEffect(() => {
    // 题目分片还在加载中，不生成本轮题目（避免空数据时提前设置 sessionKey 导致后续跳过）
    if (versionQuestions.length === 0) {
      setSessionQuestions([]);
      return;
    }
    const key = `${subjectKey}|${version}|${lessonTitle}|${sessionCount}|${restartTrigger}`;
    // key 未变化则不重算（避免作答时 store 变化触发重入）
    if (key === sessionKeyRef.current) return;
    sessionKeyRef.current = key;

    const unanswered = versionQuestions.filter(
      (q) => !answeredHistory.includes(q.id),
    );
    // 未答题不足且总题量充足，说明已答完一轮，重置该版本记录
    if (unanswered.length < sessionCount && versionQuestions.length >= MIN_QUESTIONS) {
      resetAnsweredBySubjectVersion(subjectKey, version);
      const pool = versionQuestions;
      setSessionQuestions(shuffle(pool).slice(0, Math.min(sessionCount, pool.length)));
    } else {
      const pool = unanswered.length >= sessionCount ? unanswered : versionQuestions;
      setSessionQuestions(shuffle(pool).slice(0, Math.min(sessionCount, pool.length)));
    }
    setAnswersMap({});
    setCurrentIndex(0);
    setShowCard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectKey, version, lessonTitle, sessionCount, versionQuestions, restartTrigger]);

  const currentQ = sessionQuestions[currentIndex];
  const currentAnswer = currentQ ? answersMap[currentQ.id] : undefined;
  const isAnswered = !!currentAnswer;

  // 统计（必须在 early return 之前，保证 Hooks 顺序一致）
  const stats = useMemo(() => {
    let correct = 0, wrong = 0, unanswered = 0;
    sessionQuestions.forEach((q) => {
      const a = answersMap[q.id];
      if (!a) unanswered++;
      else if (a.status === "correct") correct++;
      else wrong++;
    });
    return { correct, wrong, unanswered };
  }, [sessionQuestions, answersMap]);

  if (versionQuestions.length === 0) {
    return (
      <div className="mobile-frame flex flex-col items-center justify-center bg-white">
        <p className="font-kai text-navy-800/50 mb-2">该版本暂无题目</p>
        <p className="text-[10px] text-navy-800/40 mb-4">{info.name} · {version}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
        >
          返回
        </button>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="mobile-frame flex items-center justify-center">
        <p className="font-kai text-navy-800/50">题目加载中...</p>
      </div>
    );
  }

  // 从 store 实时读取收藏状态（sessionQuestions 是快照，不会随 store 更新）
  const collectedNow = questions.find((q) => q.id === currentQ.id)?.collected ?? false;

  // 选择即作答，直接反馈
  // 统一用选项索引字母（A/B/C/D）作为答案比较媒介
  const handleSelect = (letter: string) => {
    if (isAnswered) return;
    const isCorrect = isLetterCorrect(letter);
    const status: QStatus = isCorrect ? "correct" : "wrong";
    setAnswersMap((m) => ({ ...m, [currentQ.id]: { selected: letter, status } }));
    addAnsweredQuestion(currentQ.id);
    incrementTodayLearned(subjectKey);
    recordTodayAnswer(subjectKey, isCorrect);
    // 答错时自动加入错题本（去重）
    if (!isCorrect && !errorBook.some((e) => e.questionId === currentQ.id)) {
      handleAddToErrorBook(letter);
    }
  };

  const isInErrorBook = errorBook.some((e) => e.questionId === currentQ.id);

  // 将字母（A/B/C/D）转为完整选项文本
  const letterToText = (letter: string): string => {
    const idx = letter.charCodeAt(0) - 65;
    return currentQ.options[idx] || letter;
  };

  // 判断某个字母是否为正确答案
  // 兼容两种数据格式：
  //   1. answer 为字母（如 "A"/"B"）
  //   2. answer 为完整选项文本（如 "夏朝"）
  const isLetterCorrect = (letter: string): boolean => {
    const idx = letter.charCodeAt(0) - 65;
    const optionText = currentQ.options[idx] || "";
    if (Array.isArray(currentQ.answer)) {
      return currentQ.answer.some((a) => {
        const aIdx = a.charCodeAt(0) - 65;
        // answer 是字母
        if (a.length === 1 && aIdx >= 0 && aIdx < 26) return a === letter;
        // answer 是文本
        return a === optionText;
      });
    }
    const a = currentQ.answer;
    const aIdx = a.charCodeAt(0) - 65;
    // answer 是字母
    if (a.length === 1 && aIdx >= 0 && aIdx < 26) return a === letter;
    // answer 是文本
    return a === optionText;
  };

  // 正确答案展示文本
  const correctAnswerText = Array.isArray(currentQ.answer)
    ? currentQ.answer.map((a) => {
        const aIdx = a.charCodeAt(0) - 65;
        return a.length === 1 && aIdx >= 0 && aIdx < 26 ? letterToText(a) : a;
      }).join("、")
    : (() => {
        const a = currentQ.answer;
        const aIdx = a.charCodeAt(0) - 65;
        return a.length === 1 && aIdx >= 0 && aIdx < 26 ? letterToText(a) : a;
      })();

  // 答错时自动加入错题本（去重），传入用户所选字母
  const handleAddToErrorBook = (letter?: string) => {
    const sel = letter || currentAnswer?.selected;
    if (!sel) return;
    if (errorBook.some((e) => e.questionId === currentQ.id)) return;
    // 计算"用户所选选项的错因"和"正确选项的思路"，存入错题本
    const selIdx = sel.charCodeAt(0) - 65;
    const opts = currentQ.options;
    const ans = Array.isArray(currentQ.answer) ? currentQ.answer.join("") : String(currentQ.answer);
    const normalized = ans.replace(/[对√]/g, "A").replace(/[错×]/g, "B");
    const letters = normalized.toUpperCase().match(/[A-Z]/g) || [];
    const correctIdx = letters.map((l) => l.charCodeAt(0) - 65).find((i) => i >= 0 && i < opts.length);
    const optAnalysis = currentQ.optionAnalysis;
    addToErrorBook({
      id: `err-${currentQ.id}-${Date.now()}`,
      questionId: currentQ.id,
      subject: subjectKey,
      type: currentQ.type as "single" | "multiple" | "judge",
      grade: currentQ.grade,
      version: currentQ.version,
      stem: currentQ.stem,
      options: currentQ.options,
      selectedAnswer: letterToText(sel),
      correctAnswer: correctAnswerText,
      analysis: currentQ.analysis,
      wrongReason: optAnalysis?.[selIdx],
      rightThought: optAnalysis?.[correctIdx ?? -1] || currentQ.analysis,
      solution: currentQ.solution,
      source: "practice",
      addedAt: Date.now(),
    });
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (currentIndex === sessionQuestions.length - 1) {
      // 最后一题，显示结算页
      setShowResult(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const handleJumpTo = (i: number) => {
    setCurrentIndex(i);
    setShowCard(false);
  };

  // 已掌握知识点百分比 = 答对题数 / 总题数
  const masterRate = sessionQuestions.length > 0
    ? Math.round((stats.correct / sessionQuestions.length) * 100)
    : 0;

  const handleRestart = () => {
    // 递增触发器强制 useEffect 重新生成题目（优先取未答过的题）
    setRestartTrigger((n) => n + 1);
    setAnswersMap({});
    setCurrentIndex(0);
    setShowCard(false);
    setShowResult(false);
  };

  const remainingCount = versionQuestions.filter(
    (q) => !answeredHistory.includes(q.id),
  ).length;

  // 结算页：所有题答完后显示
  if (showResult) {
    const total = sessionQuestions.length;
    const correct = stats.correct;
    const wrong = stats.wrong;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 根据正确率生成鼓励话术
    let encouragement = "";
    let emoji = "";
    if (rate === 100) {
      encouragement = "满分通关！你是真正的学霸，所有题目全部答对，继续保持这份认真与专注！";
      emoji = "🏆";
    } else if (rate >= 80) {
      encouragement = "表现非常出色！正确率很高，知识点掌握扎实，再接再厉就能更上一层楼！";
      emoji = "🌟";
    } else if (rate >= 60) {
      encouragement = "不错的成绩！大部分知识点已经掌握，把错题认真复习一遍，下次一定更好！";
      emoji = "💪";
    } else if (rate >= 40) {
      encouragement = "还有进步空间！不要气馁，把错题弄懂就是最大的收获，坚持练习必定进步！";
      emoji = "📚";
    } else {
      encouragement = "本次答题不理想，但每次练习都是成长。建议回到章节复习知识点，再来挑战！";
      emoji = "🌱";
    }

    return (
      <div className="mobile-frame flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center">
          {/* 顶部装饰 */}
          <div className="text-5xl mb-3">{emoji}</div>
          <h1 className="brush-title text-3xl text-navy-900 mb-1">答题完成</h1>
          <p className="font-kai text-xs text-navy-800/50 mb-6">
            {info.name} · {version || tb?.versions[0]}
          </p>

          {/* 正确率环形 */}
          <div className="relative w-36 h-36 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={rate >= 60 ? "#0369A1" : "#7DD3FC"}
                strokeWidth="3"
                strokeDasharray={`${rate * 0.94} 100`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl text-navy-900 font-bold leading-none">{rate}</span>
              <span className="text-[10px] text-navy-800/50 font-kai mt-0.5">正确率%</span>
            </div>
          </div>

          {/* 数据三栏 */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            <div className="ink-card rounded-xl p-3 text-center">
              <p className="font-display text-xl text-navy-900 font-bold leading-none">{total}</p>
              <p className="text-[10px] text-navy-800/50 font-kai mt-1">总题数</p>
            </div>
            <div className="ink-card rounded-xl p-3 text-center" style={{ borderLeft: "3px solid #0369A1" }}>
              <p className="font-display text-xl text-navy-700 font-bold leading-none">{correct}</p>
              <p className="text-[10px] text-navy-800/50 font-kai mt-1">答对</p>
            </div>
            <div className="ink-card rounded-xl p-3 text-center" style={{ borderLeft: "3px solid #7DD3FC" }}>
              <p className="font-display text-xl text-navy-400 font-bold leading-none">{wrong}</p>
              <p className="text-[10px] text-navy-800/50 font-kai mt-1">答错</p>
            </div>
          </div>

          {/* 鼓励话术 */}
          <div className="ink-card rounded-2xl p-4 w-full mb-6" style={{ borderLeft: `3px solid ${info.color}` }}>
            <p className="text-[10px] font-kai text-navy-800/50 mb-1.5 flex items-center gap-1">
              <span className="seal-stamp text-[9px] px-1 py-0.5">寄语</span>
              老师寄语
            </p>
            <p className="font-kai text-sm text-navy-900 leading-relaxed">{encouragement}</p>
          </div>

          {/* 操作按钮 */}
          <button
            onClick={() => navigate("/app/home")}
            className="w-full btn-navy py-3 rounded-xl font-kai text-sm font-bold mb-2"
          >
            返回主页
          </button>
          <button
            onClick={() => {
              handleRestart();
            }}
            className="w-full py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
          >
            再练一轮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-frame flex flex-col bg-white">
      {/* 顶部 */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
              style={{ background: info.bgColor, color: info.color }}
            >
              {info.shortName}
            </span>
            <h1 className="font-kai text-sm font-bold text-navy-900">{info.name}</h1>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-[10px] text-navy-800/50 truncate">{version || tb?.versions[0]}</p>
            <span className="text-[9px] text-navy-500/40">·</span>
            <span className="text-[9px] text-navy-500/60 inline-flex items-center gap-0.5">
              <Shuffle size={9} />
              剩余 {remainingCount} 题
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-base text-navy-900 font-bold leading-none">
            {currentIndex + 1}/{sessionQuestions.length}
          </p>
          <p className="text-[9px] text-navy-800/50">对 {stats.correct} · 错 {stats.wrong}</p>
        </div>
      </header>

      {/* 进度条 */}
      <div className="h-1 bg-navy-500/8">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%`,
            background: info.color,
          }}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        {/* 题型版本 + 收藏（最右） */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: info.bgColor, color: info.color }}
          >
            {currentQ.type === "single" ? "单选题" : currentQ.type === "multiple" ? "多选题" : "判断题"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-500/8 text-navy-800/50 font-kai">
            {currentQ.version}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { toggleCollect(currentQ.id); showCollectToast(!collectedNow); }}
            className={`flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full transition-all ${
              collectedNow
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-white text-navy-800/60 border border-navy-500/15"
            }`}
          >
            <Star size={13} fill={collectedNow ? "currentColor" : "none"} strokeWidth={collectedNow ? 2.5 : 2} />
            {collectedNow ? "已收藏" : "收藏"}
          </button>
        </div>

        {/* 题干 */}
        <div className="ink-card rounded-2xl p-4 mb-4">
          <p className="font-kai text-base text-navy-900 leading-relaxed">{currentQ.stem}</p>
        </div>

        {/* 选项：选择即反馈，红绿标注（绿=正确，红=错答） */}
        <div className="space-y-2 mb-4">
          {currentQ.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = currentAnswer?.selected === letter;
            const isAnswer = isLetterCorrect(letter);

            let bgClass = "bg-paper-light border-navy-500/10";
            let letterBg = "bg-navy-500/8 text-navy-900";
            let iconEl: React.ReactNode = null;

            if (isAnswered) {
              if (isAnswer) {
                // 正确答案：绿色
                bgClass = "bg-emerald-50 border-emerald-500";
                letterBg = "bg-emerald-500 text-white";
                iconEl = <CheckCircle2 size={16} className="text-emerald-600" />;
              } else if (isSelected) {
                // 用户错答：红色
                bgClass = "bg-red-50 border-red-500";
                letterBg = "bg-red-500 text-white";
                iconEl = <XCircle size={16} className="text-red-500" />;
              }
            }

            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={isAnswered}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${bgClass}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${letterBg}`}
                >
                  {letter}
                </span>
                <span className="flex-1 font-kai text-sm text-navy-900">{opt}</span>
                {iconEl}
              </button>
            );
          })}
        </div>

        {/* 答案情况卡片：作答后显示 */}
        {isAnswered && currentAnswer && (
          <div className="ink-card rounded-2xl p-4 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`seal-stamp text-[9px] px-1.5 py-0.5 ${currentAnswer.status === "correct" ? "bg-emerald-600" : "bg-red-500"}`}
              >
                {currentAnswer.status === "correct" ? "答对" : "答错"}
              </span>
              <span className="font-kai text-sm font-bold text-navy-900">答案情况</span>
            </div>

            {/* 正确答案 / 错误答案 */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-kai text-emerald-700 font-bold flex-shrink-0 mt-0.5">正确答案</span>
                <span className="text-xs font-kai text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {correctAnswerText}
                </span>
              </div>
              {currentAnswer.status === "wrong" && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-kai text-red-600 font-bold flex-shrink-0 mt-0.5">你的答案</span>
                  <span className="text-xs font-kai text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    {letterToText(currentAnswer.selected)}
                  </span>
                </div>
              )}
            </div>

            {/* 错题解析：答错时显示；优先选项级解析，回退到通用 analysis */}
            {currentAnswer.status === "wrong" && (() => {
              const selIdx = currentAnswer.selected.charCodeAt(0) - 65;
              const optAnalysis = currentQ.optionAnalysis;
              const wrongReason = optAnalysis?.[selIdx] || currentQ.analysis;
              return (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50/60 border border-red-200">
                  <p className="text-[10px] font-kai text-red-700 font-bold mb-1 flex items-center gap-1">
                    <XCircle size={11} />
                    错题解析
                  </p>
                  <p className="font-kai text-[11px] text-red-700/90 leading-relaxed">
                    {wrongReason
                      ? wrongReason
                      : `你选择了「${letterToText(currentAnswer.selected)}」，该选项不符合题意。正确选项为「${correctAnswerText}」。`}
                  </p>
                </div>
              );
            })()}

            {/* 正确思路：取正确选项位置的解析，无则回退到 analysis */}
            {(() => {
              const correctIdx = (() => {
                const opts = currentQ.options;
                const ans = Array.isArray(currentQ.answer) ? currentQ.answer.join("") : String(currentQ.answer);
                const normalized = ans.replace(/[对√]/g, "A").replace(/[错×]/g, "B");
                const letters = normalized.toUpperCase().match(/[A-Z]/g) || [];
                const idx = letters.map((l) => l.charCodeAt(0) - 65).find((i) => i >= 0 && i < opts.length);
                return idx;
              })();
              const rightThought = currentQ.optionAnalysis?.[correctIdx ?? -1] || currentQ.analysis;
              return (
                <div className="mb-3 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <p className="text-[10px] font-kai text-emerald-700 font-bold mb-1 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    正确思路
                  </p>
                  <p className="font-kai text-[11px] text-navy-800 leading-relaxed">
                    {rightThought || "暂无正确思路，请管理员在题库管理中点击「AI生成解析」"}
                  </p>
                </div>
              );
            })()}

            {/* 答错时自动加入错题本，仅显示提示 */}
            {currentAnswer.status === "wrong" && (
              <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-kai text-xs font-bold bg-navy-500/8 text-navy-800/40">
                <Check size={13} />
                已自动加入错题本
              </div>
            )}

            <button
              onClick={() => toggleMastered(currentQ.id)}
              className={`mt-2 w-full flex items-center justify-center gap-1 text-[11px] px-3 py-1.5 rounded-full transition-colors ${
                currentQ.mastered
                  ? "bg-navy-600/15 text-navy-600"
                  : "bg-navy-500/8 text-navy-800/50"
              }`}
            >
              <CheckCircle2 size={12} fill={currentQ.mastered ? "currentColor" : "none"} />
              {currentQ.mastered ? "已掌握" : "标记为已掌握"}
            </button>
          </div>
        )}
      </main>

      {/* 底部：答题卡固定在最左侧 */}
      <footer className="px-4 py-3 border-t border-navy-500/8 bg-white pb-[calc(12px+env(safe-area-inset-bottom))]">
        {!isAnswered ? (
          // 未作答：答题卡在左 + 提示在右
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCard(true)}
              className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
            >
              <Grid3x3 size={15} />
              答题卡
            </button>
            <span className="flex-1 text-[11px] text-navy-800/40 font-kai">
              选择答案后将显示解析与正确思路
            </span>
          </div>
        ) : (
          // 已作答：答题卡在左 / 上一题 / 下一题
          <div className="flex gap-2">
            <button
              onClick={() => setShowCard(true)}
              className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl border border-navy-500/15 text-navy-900 font-kai text-sm"
            >
              <Grid3x3 size={15} />
              答题卡
            </button>

            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl font-kai text-sm transition-all ${
                currentIndex === 0
                  ? "bg-navy-500/5 text-navy-800/30"
                  : "border border-navy-500/15 text-navy-900"
              }`}
            >
              <ChevronLeft size={16} />
              上一题
            </button>

            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1 btn-navy py-3 rounded-xl font-kai text-sm font-bold"
            >
              {currentIndex === sessionQuestions.length - 1 ? "完成学习" : "下一题"}
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="mx-auto mt-2 flex items-center gap-1 text-[10px] text-navy-800/40 font-kai hover:text-navy-600"
        >
          <RotateCcw size={11} />
          重做本轮
        </button>
      </footer>

      {/* 答题卡：独立全屏页面，覆盖当前答题页 */}
      {showCard && (
        <div className="!fixed inset-0 z-50 bg-white w-full max-w-[var(--frame-max)] mx-auto h-[100vh] overflow-y-auto">
          {/* 顶部标题栏 */}
          <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white sticky top-0 z-10">
            <button
              onClick={() => setShowCard(false)}
              className="p-1 -ml-1 flex items-center gap-1 text-navy-900 font-kai text-sm"
            >
              <ChevronLeft size={22} />
              返回
            </button>
            <h1 className="flex-1 font-kai text-sm font-bold text-navy-900">答题卡</h1>
            <span className="text-[10px] text-navy-800/50 font-kai">
              {currentIndex + 1}/{sessionQuestions.length}
            </span>
          </header>

          {/* 大圆圈进度条（顶部居中，底部留 1/5 缺口） */}
          <div className="pt-10 pb-6 flex justify-center">
            <div className="relative w-52 h-52">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* 背景圆环（同样留 1/5 缺口） */}
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="rgba(14,165,233,0.1)"
                  strokeWidth="6"
                  strokeDasharray="211.2 264"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(90 50 50)"
                />
                {/* 进度圆环（按比例绘制，留 1/5 缺口） */}
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={masterRate >= 60 ? "#10B981" : "#0EA5E9"}
                  strokeWidth="6"
                  strokeDasharray={`${(masterRate / 100) * 211.2} 264`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(90 50 50)"
                  className="transition-all duration-700"
                />
              </svg>
              {/* 圆心文字信息（全部在圆圈内） */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-navy-800/50 font-kai mb-1">已掌握知识点</span>
                <span className="font-display text-4xl text-navy-900 font-bold leading-none">{masterRate}<span className="text-2xl">%</span></span>
                <span className="text-[11px] text-navy-800/60 font-kai mt-1.5">
                  {masterRate >= 80 ? "继续保持！" : masterRate >= 60 ? "再接再厉！" : "继续加油！"}
                </span>
              </div>
            </div>
          </div>

          {/* 统计行 */}
          <div className="px-5 pb-3 flex items-center justify-center gap-4 text-[11px] font-kai">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-navy-800/60">对 {stats.correct}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span className="text-navy-800/60">错 {stats.wrong}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-navy-500/15" />
              <span className="text-navy-800/60">未答 {stats.unanswered}</span>
            </span>
            <span className="text-navy-800/50">共 {sessionQuestions.length} 题</span>
          </div>

          {/* 题号网格 */}
          <div className="px-5 py-4 pb-6">
            <p className="text-[10px] text-navy-800/40 font-kai text-center mb-3">点击题号可跳转</p>
            <div className="grid grid-cols-6 gap-2">
              {sessionQuestions.map((q, i) => {
                const a = answersMap[q.id];
                const isCurrent = i === currentIndex;
                let cls = "bg-navy-500/8 text-navy-900 border-navy-500/15";
                if (a?.status === "correct") cls = "bg-emerald-500 text-white border-emerald-500";
                else if (a?.status === "wrong") cls = "bg-red-500 text-white border-red-500";
                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpTo(i)}
                    className={`aspect-square rounded-lg text-xs font-bold border-2 transition-all flex items-center justify-center ${cls} ${
                      isCurrent ? "ring-2 ring-navy-600 ring-offset-1" : ""
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowCard(false)}
              className="w-full mt-5 py-2.5 rounded-xl btn-navy font-kai text-sm font-bold"
            >
              返回答题
            </button>
          </div>
        </div>
      )}

      {/* 收藏成功/取消提示 */}
      {collectToast.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-navy-900/80 text-white px-5 py-2.5 rounded-xl text-sm font-kai shadow-lg animate-fade-in pointer-events-none">
          {collectToast.text}
        </div>
      )}
    </div>
  );
}
