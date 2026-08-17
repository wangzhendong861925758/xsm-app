import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  RotateCcw, Grid3x3, Check,
} from "lucide-react";
import { SUBJECTS } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import type { Subject, Question } from "@/data/types";
import { shuffle, randomInRange } from "@/lib/utils";
import { fetchVersions } from "@/lib/api";

// 大题每次训练数量（5-8 题，大题作答时间长）
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 8;

function randomSessionCount(): number {
  return randomInRange(MIN_QUESTIONS, MAX_QUESTIONS);
}

/**
 * 大题判分：检查学生答案是否命中要点
 * 命中所有要点（或权重达到80%以上）判定为正确
 */
function gradeEssay(studentAnswer: string, question: Question): { correct: boolean; hitPoints: string[]; missPoints: string[]; hitRate: number } {
  if (!question.keyPoints || question.keyPoints.length === 0) {
    // 没有要点数据，按字数粗略判断
    return {
      correct: studentAnswer.length >= (question.wordLimit || 100) * 0.5,
      hitPoints: [],
      missPoints: [],
      hitRate: studentAnswer.length > 0 ? 1 : 0,
    };
  }
  const answer = studentAnswer.toLowerCase().replace(/\s/g, "");
  let totalWeight = 0;
  let hitWeight = 0;
  const hitPoints: string[] = [];
  const missPoints: string[] = [];
  for (const kp of question.keyPoints) {
    const w = kp.weight || 1;
    totalWeight += w;
    const keyword = kp.text.toLowerCase().replace(/\s/g, "");
    if (answer.includes(keyword)) {
      hitWeight += w;
      hitPoints.push(kp.text);
    } else {
      missPoints.push(kp.text);
    }
  }
  const hitRate = totalWeight > 0 ? hitWeight / totalWeight : 0;
  // 命中权重80%以上判为正确
  return {
    correct: hitRate >= 0.8,
    hitPoints,
    missPoints,
    hitRate,
  };
}

type QStatus = "unanswered" | "correct" | "wrong";

export default function EssayPracticePage() {
  const { subject = "biology" } = useParams<{ subject: string }>();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version") || "";
  // 课时标题，用于按课时过滤题目（如 "第1课时 奏响中学序曲"）
  const lessonTitle = searchParams.get("lesson") || "";
  const navigate = useNavigate();
  const {
    selectedGrade,
    incrementTodayLearned,
    recordTodayAnswer,
    addToErrorBook,
    answeredHistory,
    addAnsweredQuestion,
    resetAnsweredBySubjectVersion,
    questions,
    loadQuestions,
  } = useStore();

  const subjectKey = subject as Subject;
  const info = SUBJECTS[subjectKey];

  // 按需加载题目分片
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let v = version;
      if (!v) {
        const versions = await fetchVersions(subjectKey, selectedGrade);
        v = versions[0]?.version || "";
      }
      if (v && !cancelled) loadQuestions(subjectKey, selectedGrade, v);
    })();
    return () => { cancelled = true; };
  }, [subjectKey, selectedGrade, version, loadQuestions]);

  // 题库筛选：按学段+学科+版本+课时+大题类型
  const versionQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.subject !== subjectKey) return false;
      if (q.grade !== selectedGrade) return false;
      // 版本匹配：管理端未指定版本时匹配所有
      if (q.version && version && q.version !== version) return false;
      // 大题专项训练：仅取大题
      if (q.type !== "essay") return false;
      // 若指定了课时标题，则按 section 过滤
      if (lessonTitle && q.section && q.section !== lessonTitle) return false;
      return true;
    });
  }, [questions, subjectKey, selectedGrade, version, lessonTitle]);

  // 本次训练题目（避免依赖问题导致重渲染）
  const sessionKeyRef = useRef<string>("");
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [sessionCount, setSessionCount] = useState<number>(randomSessionCount());

  useEffect(() => {
    // 题目分片还在加载中，不生成本轮题目（避免空数据时提前设置 sessionKey 导致后续跳过）
    if (versionQuestions.length === 0) {
      setSessionQuestions([]);
      return;
    }
    const key = `${subjectKey}|${version}|${lessonTitle}|${sessionCount}`;
    if (sessionKeyRef.current === key) return;
    sessionKeyRef.current = key;
    // 题目轮转：优先未答过的题；答完一轮后重置记录
    const unanswered = versionQuestions.filter(
      (q) => !answeredHistory.includes(q.id),
    );
    if (unanswered.length < sessionCount && versionQuestions.length >= MIN_QUESTIONS) {
      resetAnsweredBySubjectVersion(subjectKey, version);
      const pool = versionQuestions;
      setSessionQuestions(shuffle(pool).slice(0, Math.min(sessionCount, pool.length)));
    } else {
      const pool = unanswered.length >= sessionCount ? unanswered : versionQuestions;
      setSessionQuestions(shuffle(pool).slice(0, Math.min(sessionCount, pool.length)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectKey, version, lessonTitle, sessionCount, versionQuestions]);

  const [currentIdx, setCurrentIdx] = useState(0);
  // 每题作答：学生答案
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  // 每题判分结果
  const [gradeMap, setGradeMap] = useState<Record<number, { correct: boolean; hitPoints: string[]; missPoints: string[]; hitRate: number }>>({});
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentQ = sessionQuestions[currentIdx];
  const studentAnswer = answersMap[currentIdx] || "";
  const grade = gradeMap[currentIdx];
  const isAnswered = !!grade;

  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    sessionQuestions.forEach((_, i) => {
      const g = gradeMap[i];
      if (!g) unanswered++;
      else if (g.correct) correct++;
      else wrong++;
    });
    return { correct, wrong, unanswered, total: sessionQuestions.length };
  }, [sessionQuestions, gradeMap]);

  const handleSubmit = () => {
    if (!currentQ || !studentAnswer.trim()) return;
    const result = gradeEssay(studentAnswer, currentQ);
    setGradeMap({ ...gradeMap, [currentIdx]: result });
    addAnsweredQuestion(currentQ.id);
    incrementTodayLearned(subjectKey);
    recordTodayAnswer(subjectKey, result.correct);
    // 答错加入错题集
    if (!result.correct) {
      addToErrorBook({
        id: `err-${currentQ.id}-${Date.now()}`,
        questionId: currentQ.id,
        subject: subjectKey,
        type: "essay",
        grade: currentQ.grade,
        version: currentQ.version,
        stem: currentQ.stem,
        options: currentQ.options,
        correctAnswer: Array.isArray(currentQ.answer) ? currentQ.answer.join("；") : currentQ.answer,
        selectedAnswer: studentAnswer,
        analysis: currentQ.analysis,
        solution: currentQ.solution,
        addedAt: Date.now(),
      });
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };
  const handleNext = () => {
    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResult(true);
    }
  };
  const handleJumpTo = (idx: number) => {
    setCurrentIdx(idx);
    setShowAnswerSheet(false);
  };

  // 已掌握知识点百分比 = 答对题数 / 总题数
  const masterRate = stats.total > 0
    ? Math.round((stats.correct / stats.total) * 100)
    : 0;

  const handleRestart = () => {
    setAnswersMap({});
    setGradeMap({});
    setCurrentIdx(0);
    setShowResult(false);
    setSessionCount(randomSessionCount());
    sessionKeyRef.current = "";
  };

  // ============ 结算页 ============
  if (showResult) {
    const rate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    let encouragement = "";
    let medal = "";
    if (rate === 100) { medal = "🏆"; encouragement = "满分通关！你的大题解答思路清晰、要点完整，是真正的学霸！"; }
    else if (rate >= 80) { medal = "🌟"; encouragement = "表现非常出色！大题要点把握准确，解题思路清晰，继续保持！"; }
    else if (rate >= 60) { medal = "💪"; encouragement = "不错的成绩！大题大部分要点已经掌握，继续努力！"; }
    else if (rate >= 40) { medal = "📚"; encouragement = "还有进步空间！大题要点把握不够全面，建议多看解析和推荐思路。"; }
    else { medal = "🌱"; encouragement = "本次答题不理想，但每次练习都是成长，认真阅读推荐思路，下次会更好！"; }

    const circumference = 2 * Math.PI * 52;
    const dashOffset = circumference * (1 - rate / 100);

    return (
      <div className="mobile-frame flex flex-col bg-white">
        <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white">
          <button onClick={() => navigate("/app/home")} className="p-1 -ml-1">
            <ChevronLeft size={22} className="text-navy-900" />
          </button>
          <h1 className="font-kai text-sm font-bold text-navy-900">大题训练结算</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center">
          {/* 环形正确率 */}
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={rate >= 60 ? "#0369A1" : "#7DD3FC"}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: rate >= 60 ? "#0369A1" : "#7DD3FC" }}>{rate}%</span>
              <span className="text-[10px] text-navy-800/50 font-kai mt-0.5">正确率</span>
            </div>
          </div>

          {/* 数据卡片 */}
          <div className="grid grid-cols-3 gap-3 w-full mb-5">
            <div className="ink-card rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-[10px] text-navy-800/50 font-kai mt-0.5">总题数</p>
            </div>
            <div className="ink-card rounded-xl p-3 text-center" style={{ background: "rgba(3,105,161,0.08)" }}>
              <p className="text-xl font-bold text-navy-700">{stats.correct}</p>
              <p className="text-[10px] text-navy-700/70 font-kai mt-0.5">答对</p>
            </div>
            <div className="ink-card rounded-xl p-3 text-center" style={{ background: "rgba(125,211,252,0.15)" }}>
              <p className="text-xl font-bold text-navy-400">{stats.wrong}</p>
              <p className="text-[10px] text-navy-400/70 font-kai mt-0.5">答错</p>
            </div>
          </div>

          {/* 老师寄语 */}
          <div className="ink-card rounded-2xl p-4 w-full mb-5" style={{ borderLeft: `3px solid ${info.color}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{medal}</span>
              <span className="font-kai text-sm font-bold text-navy-900">老师寄语</span>
              <span
                className="ml-auto text-[10px] font-kai px-2 py-0.5 rounded-full text-paper"
                style={{ background: info.color }}
              >寄语</span>
            </div>
            <p className="text-xs text-navy-800/70 font-kai leading-relaxed">{encouragement}</p>
          </div>
        </main>

        <footer className="px-5 py-3 border-t border-navy-500/8 bg-white pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <button onClick={handleRestart} className="flex-1 py-3 rounded-xl border border-navy-500/20 text-navy-900 font-kai text-sm font-bold">
              <RotateCcw size={14} className="inline mr-1" />再练一轮
            </button>
            <button onClick={() => navigate("/app/home")} className="flex-1 py-3 rounded-xl btn-navy font-kai text-sm font-bold">
              返回主页
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // 空状态
  if (versionQuestions.length === 0) {
    return (
      <div className="mobile-frame flex flex-col bg-white">
        <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ChevronLeft size={22} className="text-navy-900" />
          </button>
          <h1 className="font-kai text-sm font-bold text-navy-900">{info.name} · 大题训练</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5">
          <span className="text-5xl mb-3 opacity-30">📝</span>
          <p className="font-kai text-sm text-navy-800/50 text-center">
            当前学段/版本暂无大题<br />
            <span className="text-[11px]">({selectedGrade} · {version || "默认版本"})</span>
          </p>
          <button onClick={() => navigate(-1)} className="mt-5 px-5 py-2 rounded-lg btn-navy font-kai text-xs font-bold">
            返回
          </button>
        </main>
      </div>
    );
  }

  if (!currentQ) return null;

  const isLast = currentIdx === sessionQuestions.length - 1;

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
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
              style={{ background: info.bgColor, color: info.color }}
            >{info.icon}</span>
            <h1 className="font-kai text-sm font-bold text-navy-900">{info.name} · 大题训练</h1>
            <span
              className="text-[10px] font-kai px-2 py-0.5 rounded-full"
              style={{ background: `${info.color}15`, color: info.color }}
            >大题</span>
          </div>
          <p className="text-[10px] text-navy-800/50 mt-0.5">
            {selectedGrade} · {version || "默认版本"} · 第 {currentIdx + 1}/{sessionQuestions.length} 题
          </p>
        </div>
        <button
          onClick={() => setShowAnswerSheet(true)}
          className="p-1.5 rounded-lg bg-navy-500/8"
        >
          <Grid3x3 size={16} className="text-navy-600" />
        </button>
      </header>

      {/* 主体 */}
      <main className="flex-1 overflow-y-auto px-5 py-4">
        {/* 题干 */}
        <div className="ink-card rounded-2xl p-4 mb-3" style={{ borderLeft: `3px solid ${info.color}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-kai px-2 py-0.5 rounded text-paper"
              style={{ background: info.color }}
            >大题</span>
            {currentQ.wordLimit && (
              <span className="text-[10px] text-navy-800/40 font-kai">建议字数 {currentQ.wordLimit}</span>
            )}
          </div>
          <p className="font-kai text-sm text-navy-900 leading-relaxed whitespace-pre-wrap">{currentQ.stem}</p>
        </div>

        {/* 作答区 */}
        <div className="ink-card rounded-2xl p-4 mb-3">
          <p className="text-xs font-kai font-bold text-navy-900 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-3 rounded-full" style={{ background: info.color }} />
            你的作答
          </p>
          <textarea
            value={studentAnswer}
            onChange={(e) => !isAnswered && setAnswersMap({ ...answersMap, [currentIdx]: e.target.value })}
            disabled={isAnswered}
            placeholder="请在此处输入你的答案，注意要点完整、思路清晰…"
            className="w-full min-h-[140px] p-3 rounded-xl border border-navy-500/15 bg-white/60 text-sm font-kai text-navy-900 leading-relaxed resize-none focus:outline-none focus:border-navy-500/50 disabled:opacity-70"
            style={{ fontSize: "13px" }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-navy-800/40 font-kai">{studentAnswer.length} 字</span>
            {!isAnswered && (
              <button
                onClick={handleSubmit}
                disabled={!studentAnswer.trim()}
                className={`px-4 py-1.5 rounded-lg font-kai text-xs font-bold transition-all ${
                  studentAnswer.trim() ? "btn-navy" : "bg-navy-500/8 text-navy-800/40"
                }`}
              >
                提交作答
              </button>
            )}
          </div>
        </div>

        {/* 答案情况 */}
        {isAnswered && grade && (
          <div className="space-y-3 animate-fade-in">
            {/* 判定结果 */}
            <div
              className="ink-card rounded-2xl p-4"
              style={{
                borderLeft: `3px solid ${grade.correct ? "#10B981" : "#EF4444"}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {grade.correct ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
                <span
                  className="text-xs font-kai font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: grade.correct ? "#10B981" : "#EF4444" }}
                >
                  {grade.correct ? "答对" : "答错"}
                </span>
                <span className="text-[11px] text-navy-800/50 font-kai ml-auto">
                  要点命中 {Math.round(grade.hitRate * 100)}%
                </span>
              </div>

              {/* 要点命中情况 */}
              {currentQ.keyPoints && currentQ.keyPoints.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-kai font-bold text-navy-900 mb-1.5">要点命中情况：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQ.keyPoints.map((kp, i) => {
                      const hit = grade.hitPoints.includes(kp.text);
                      return (
                        <span
                          key={i}
                          className={`text-[10px] font-kai px-2 py-0.5 rounded-full border ${
                            hit
                              ? "bg-emerald-50 text-emerald-600 border-emerald-500/30"
                              : "bg-red-50 text-red-500 border-red-500/30"
                          }`}
                        >
                          {hit ? "✓" : "✗"} {kp.text}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 标准答案 */}
              <div className="mt-2 pt-2 border-t border-navy-500/8">
                <p className="text-[11px] font-kai font-bold text-emerald-600 mb-1">标准答案：</p>
                <p className="text-xs font-kai text-navy-800/75 leading-relaxed whitespace-pre-wrap">
                  {Array.isArray(currentQ.answer) ? currentQ.answer.join("；") : currentQ.answer}
                </p>
              </div>
            </div>

            {/* 错题解析 */}
            {!grade.correct && (
              <div className="ink-card rounded-2xl p-4" style={{ borderLeft: "3px solid #EF4444" }}>
                <p className="text-[11px] font-kai font-bold text-red-500 mb-1">错题解析：</p>
                <p className="text-xs font-kai text-navy-800/75 leading-relaxed whitespace-pre-wrap">
                  {grade.missPoints.length > 0
                    ? `你遗漏了以下要点：${grade.missPoints.join("、")}。${currentQ.analysis}`
                    : currentQ.analysis}
                </p>
              </div>
            )}

            {/* 推荐解题思路 */}
            {currentQ.solution && (
              <div className="ink-card rounded-2xl p-4" style={{ borderLeft: "3px solid #10B981" }}>
                <p className="text-[11px] font-kai font-bold text-emerald-600 mb-1.5">推荐解题思路：</p>
                <p className="text-xs font-kai text-navy-800/75 leading-relaxed whitespace-pre-wrap">
                  {currentQ.solution}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部：答题卡固定在最左侧 */}
      <footer className="px-5 py-3 border-t border-navy-500/8 bg-white pb-[calc(12px+env(safe-area-inset-bottom))]">
        {!isAnswered ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswerSheet(true)}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-navy-500/20 text-navy-900 font-kai text-xs font-bold"
            >
              <Grid3x3 size={15} />
              答题卡
            </button>
            <p className="flex-1 text-[11px] text-navy-800/40 font-kai">
              提交作答后将显示标准答案与推荐解题思路
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswerSheet(true)}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-navy-500/20 text-navy-900 font-kai text-xs font-bold"
            >
              <Grid3x3 size={15} />
              答题卡
            </button>
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`flex-1 py-2.5 rounded-xl font-kai text-xs font-bold transition-all ${
                currentIdx === 0
                  ? "bg-navy-500/8 text-navy-800/30"
                  : "border border-navy-500/20 text-navy-900"
              }`}
            >
              上一题
            </button>
            <button
              onClick={handleNext}
              className="flex-[2] py-2.5 rounded-xl btn-navy font-kai text-xs font-bold"
            >
              {isLast ? "完成学习" : "下一题"}
              {!isLast && <ChevronRight size={14} className="inline ml-1" />}
            </button>
          </div>
        )}
      </footer>

      {/* 答题卡：独立全屏页面，覆盖当前答题页 */}
      {showAnswerSheet && (
        <div className="!fixed inset-0 z-50 bg-white w-full max-w-[var(--frame-max)] mx-auto h-[100vh] overflow-y-auto">
          {/* 顶部标题栏 */}
          <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-white sticky top-0 z-10">
            <button
              onClick={() => setShowAnswerSheet(false)}
              className="p-1 -ml-1 flex items-center gap-1 text-navy-900 font-kai text-sm"
            >
              <ChevronLeft size={22} />
              返回
            </button>
            <h1 className="flex-1 font-kai text-sm font-bold text-navy-900">答题卡</h1>
            <span className="text-[10px] text-navy-800/50 font-kai">
              {currentIdx + 1}/{sessionQuestions.length}
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
            <span className="text-navy-800/50">共 {stats.total} 题</span>
          </div>

          {/* 题号网格 */}
          <div className="px-5 py-4 pb-6">
            <p className="text-[10px] text-navy-800/40 font-kai text-center mb-3">点击题号可跳转</p>
            <div className="grid grid-cols-6 gap-2">
              {sessionQuestions.map((_, i) => {
                const g = gradeMap[i];
                const isCurrent = i === currentIdx;
                let bg = "bg-navy-500/8 text-navy-800/50";
                if (g) bg = g.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
                return (
                  <button
                    key={i}
                    onClick={() => handleJumpTo(i)}
                    className={`aspect-square rounded-lg text-xs font-kai font-bold border-2 transition-all ${bg} ${
                      isCurrent ? "border-navy-600 scale-105" : "border-transparent"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAnswerSheet(false)}
              className="w-full mt-5 py-2.5 rounded-xl btn-navy font-kai text-sm font-bold"
            >
              返回答题
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
