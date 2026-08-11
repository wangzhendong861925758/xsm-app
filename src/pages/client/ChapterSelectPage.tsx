import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, BookOpen, FileText, Check, ListChecks, PenLine } from "lucide-react";
import { SUBJECTS, getTextbook } from "@/data/textbooks";
import { getChapters } from "@/data/chapters";
import { useStore } from "@/store/useStore";
import type { Subject } from "@/data/types";

export default function ChapterSelectPage() {
  const { subject = "biology" } = useParams<{ subject: string }>();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version") || "";
  const navigate = useNavigate();
  const { currentUser, selectedGrade } = useStore();

  const subjectKey = subject as Subject;
  const info = SUBJECTS[subjectKey];
  const tb = getTextbook(currentUser.grade, subjectKey);
  const chapters = getChapters(selectedGrade, subjectKey);

  const [openChapter, setOpenChapter] = useState<string | null>(chapters[0]?.id || null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  // 训练类型选择弹窗
  const [showModeSelect, setShowModeSelect] = useState(false);

  const handleStartClick = () => {
    if (!selectedLesson) return;
    setShowModeSelect(true);
  };

  const handleChooseMode = (mode: "choice" | "essay") => {
    setShowModeSelect(false);
    // 根据 lesson id 查找对应课时标题，用于题目过滤
    const lessonObj = chapters
      .flatMap((c) => c.lessons)
      .find((l) => l.id === selectedLesson);
    const lessonTitle = lessonObj?.title || "";
    if (mode === "choice") {
      navigate(
        `/app/practice/${subjectKey}?version=${encodeURIComponent(version)}&lesson=${encodeURIComponent(lessonTitle)}`,
      );
    } else {
      navigate(
        `/app/essay/${subjectKey}?version=${encodeURIComponent(version)}&lesson=${encodeURIComponent(lessonTitle)}`,
      );
    }
  };

  return (
    <div className="mobile-frame flex flex-col bg-paper bg-navy-radial">
      {/* 顶部 */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-paper-light/80 backdrop-blur sticky top-0 z-30">
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
            <h1 className="font-kai text-sm font-bold text-navy-900">{info.name} · 章节选择</h1>
          </div>
          <p className="text-[10px] text-navy-800/50 mt-0.5">
            {selectedGrade} · {version || tb?.versions[0]}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-1.5 mb-3 text-navy-800/60">
          <BookOpen size={14} />
          <span className="font-kai text-xs">请选择章节和课时</span>
        </div>

        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="font-kai text-sm text-navy-800/50">本学期暂无章节配置</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chapters.map((ch) => {
              const isOpen = openChapter === ch.id;
              return (
                <div
                  key={ch.id}
                  className="ink-card rounded-2xl overflow-hidden"
                  style={{ borderLeft: `3px solid ${info.color}` }}
                >
                  {/* 章节头 */}
                  <button
                    onClick={() => setOpenChapter(isOpen ? null : ch.id)}
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: info.bgColor, color: info.color }}
                      >
                        <FileText size={13} />
                      </span>
                      <span className="font-kai text-sm font-bold text-navy-900 truncate">{ch.title}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-navy-800/40 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* 课时列表 */}
                  {isOpen && (
                    <div className="px-4 pb-3 pt-1 border-t border-navy-500/8 animate-fade-in">
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {ch.lessons.map((ls) => {
                          const active = selectedLesson === ls.id;
                          return (
                            <button
                              key={ls.id}
                              onClick={() => setSelectedLesson(ls.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-kai border transition-all text-left ${
                                active
                                  ? "bg-navy-600 text-paper border-navy-600"
                                  : "bg-paper text-navy-900 border-navy-500/12 hover:border-navy-500/40"
                              }`}
                            >
                              {active && <Check size={11} className="flex-shrink-0" />}
                              <span className="truncate">{ls.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 底部：开始答题 */}
      <footer className="px-5 py-3 border-t border-navy-500/8 bg-paper-light/90 backdrop-blur pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button
          onClick={handleStartClick}
          disabled={!selectedLesson}
          className={`w-full py-3 rounded-xl font-kai text-sm font-bold transition-all ${
            selectedLesson ? "btn-navy" : "bg-navy-500/8 text-navy-800/40"
          }`}
        >
          {selectedLesson ? "开始答题" : "请先选择课时"}
          {selectedLesson && <ChevronRight size={16} className="inline ml-1" />}
        </button>
      </footer>

      {/* 训练类型选择：独立全屏页面，覆盖当前章节选择页 */}
      {showModeSelect && (
        <div className="!fixed inset-0 z-50 bg-white w-full max-w-[430px] mx-auto h-[100vh] overflow-y-auto">
          {/* 顶部标题栏 */}
          <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/8 bg-paper-light/80 backdrop-blur sticky top-0 z-10">
            <button
              onClick={() => setShowModeSelect(false)}
              className="p-1 -ml-1 flex items-center gap-1 text-navy-900 font-kai text-sm"
            >
              <ChevronLeft size={22} />
              返回
            </button>
            <h1 className="flex-1 font-kai text-sm font-bold text-navy-900">选择训练类型</h1>
          </header>

          {/* 内容区 */}
          <div className="px-5 py-5">
            {/* 已选课时提示 */}
            <div className="mb-4 p-3 rounded-xl border-l-[3px] bg-navy-50/40"
              style={{ borderColor: info.color }}
            >
              <p className="text-[10px] text-navy-800/50 font-kai mb-0.5">已选课时</p>
              <p className="font-kai text-sm font-bold text-navy-900">
                {chapters.flatMap((c) => c.lessons).find((l) => l.id === selectedLesson)?.title || ""}
              </p>
            </div>

            {/* 两个选项 */}
            <div className="space-y-3">
              {/* 选择判断题训练 */}
              <button
                onClick={() => handleChooseMode("choice")}
                className="w-full p-4 rounded-2xl border-2 border-navy-500/15 bg-paper hover:border-navy-500/50 transition-all text-left active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: info.bgColor, color: info.color }}
                  >
                    <ListChecks size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-kai text-sm font-bold text-navy-900">选择判断题训练</p>
                    <p className="text-[11px] text-navy-800/55 mt-0.5 font-kai leading-relaxed">
                      选择题与判断题混合训练，每次15-20题，即时判分
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-navy-800/30 flex-shrink-0 mt-2" />
                </div>
              </button>

              {/* 大题专项训练 */}
              <button
                onClick={() => handleChooseMode("essay")}
                className="w-full p-4 rounded-2xl border-2 border-navy-500/15 bg-paper hover:border-navy-500/50 transition-all text-left active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${info.color}15`, color: info.color }}
                  >
                    <PenLine size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-kai text-sm font-bold text-navy-900">大题专项训练</p>
                    <p className="text-[11px] text-navy-800/55 mt-0.5 font-kai leading-relaxed">
                      材料分析/简答/综合题，手写作答，智能评判要点
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-navy-800/30 flex-shrink-0 mt-2" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
