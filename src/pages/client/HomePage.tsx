import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Flame,
  Target,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import { GRADES, getTextbooksByGrade, SUBJECTS } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import { fetchVersions } from "@/lib/api";
import type { Subject } from "@/data/types";

const SUBJECT_ICONS: Record<string, string> = {
  physics: "/images/icon-physics.png",
  chemistry: "/images/icon-chemistry.png",
  biology: "/images/icon-biology.png",
  politics: "/images/icon-politics.png",
  history: "/images/icon-history.png",
  geography: "/images/icon-geography.png",
};

const SLIDES = ["/images/slide1.jpg", "/images/slide2.jpg", "/images/slide3.jpg"];

export default function HomePage() {
  const navigate = useNavigate();
  const {
    selectedGrade,
    setSelectedGrade,
    todayLearned,
    todayStats,
    studyDates,
    subjectTotalAnswered,
    subjectTotalCorrect,
    selectedVersions,
    setSelectedVersion,
    currentClientCode,
    checkAndRevokeExpired,
  } = useStore();
  const [gradeSelectorOpen, setGradeSelectorOpen] = useState(false);
  const [versionPickerFor, setVersionPickerFor] = useState<Subject | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  const todayAnswered = Object.values(todayLearned).reduce((a, b) => a + b, 0);
  const { correctSum, totalSum } = Object.values(todayStats).reduce(
    (acc, s) => ({ correctSum: acc.correctSum + s.correct, totalSum: acc.totalSum + s.total }),
    { correctSum: 0, totalSum: 0 },
  );
  const accuracy = totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : 0;
  const studyStreak = (() => {
    if (!studyDates?.length) return 0;
    const set = new Set(studyDates);
    let streak = 0;
    const d = new Date();
    while (set.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  const textbooks = getTextbooksByGrade(selectedGrade);

  const [realVersions, setRealVersions] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        textbooks.map(async (tb) => {
          const vs = await fetchVersions(tb.subject, selectedGrade);
          return [tb.subject, vs.map((v) => v.version)] as [string, string[]];
        }),
      );
      if (!cancelled) {
        const map: Record<string, string[]> = {};
        for (const [k, v] of entries) map[k] = v;
        setRealVersions(map);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedGrade]);

  useEffect(() => {
    const t = setInterval(() => setBannerIndex((i) => (i + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    setGradeSelectorOpen(false);
  };

  const handleStartLearn = (subject: Subject) => {
    checkAndRevokeExpired();
    const current = useStore.getState().clientAccounts.find((a) => a.code === currentClientCode);
    if (!current?.granted) {
      alert("请联系管理员开通权限");
      return;
    }
    const versions = realVersions[subject] || textbooks.find((t) => t.subject === subject)?.versions || [];
    let version = selectedVersions[subject];
    if (!version || !versions.includes(version)) {
      version = versions[0] || "";
      if (version) setSelectedVersion(subject, version);
    }
    navigate(`/app/chapter/${subject}?version=${encodeURIComponent(version)}`);
  };

  const handleSelectVersion = (subject: Subject, version: string) => {
    setSelectedVersion(subject, version);
    setVersionPickerFor(null);
  };

  return (
    <div className="min-h-full relative" style={{ background: "#F0F4FF" }}>
      {/* 顶部蓝色渐变区域 */}
      <div className="relative" style={{ background: "linear-gradient(180deg, #3B76F7 0%, #3559E8 50%, #2D4CE3 100%)", paddingBottom: "12px" }}>
        {/* 左上角品牌图 ac.png（替换时间、图标、文字） */}
        <div className="px-4 pt-3">
          <img src="/images/ac.png" alt="识途EVO" className="h-[72px] w-auto object-contain" style={{ imageRendering: "auto" }} />
        </div>

        {/* 轮播图（slide1/2/3.jpg） */}
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden relative aspect-[8/3] bg-navy-100">
          {SLIDES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIndex ? "opacity-100" : "opacity-0"}`}
            >
              <img src={src} alt={`轮播 ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
          <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`carousel-dot ${i === bannerIndex ? "active" : ""}`}
                onClick={() => setBannerIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 - 上移覆盖蓝色底部 */}
      <div className="relative z-10 px-4 -mt-4 pb-24">
        {/* 所学年级 + 统计卡片 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {/* 所学年级标题栏 */}
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2 px-4 py-3">
              <img src="/images/ss.png" alt="所学年级" className="h-8 w-8 object-contain" />
              <span className="font-alibaba font-bold text-[18px] text-gray-800">所学年级</span>
            </div>
            <button
              onClick={() => setGradeSelectorOpen(!gradeSelectorOpen)}
              className="relative px-5 py-3 flex items-center gap-1"
              style={{ background: "linear-gradient(90deg, #2266FF, #3388FF)", borderBottomLeftRadius: "28px" }}
            >
              <span className="font-alibaba font-bold text-white text-[16px]">{selectedGrade}</span>
              <ChevronDown size={18} color="#fff" className={`transition-transform ${gradeSelectorOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* 年级选择弹层 */}
          {gradeSelectorOpen && (
            <div className="border-t border-gray-100 px-4 py-3 animate-fade-in">
              <p className="text-[11px] text-gray-400 font-alibaba mb-2">选择年级 · 教材版本</p>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => {
                  const active = selectedGrade === g.key;
                  return (
                    <button
                      key={g.key}
                      onClick={() => handleGradeSelect(g.key)}
                      className={`px-2 py-2 rounded-xl text-xs font-alibaba border transition-all flex flex-col items-center ${
                        active
                          ? "bg-navy-600 text-white border-navy-600 shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-navy-500/40"
                      }`}
                    >
                      <span className="font-bold">{g.short}</span>
                      <span className={`text-[9px] mt-0.5 ${active ? "opacity-80" : "text-gray-400"}`}>{g.phase}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 三个统计数据卡片 */}
          <div className="px-3 pb-4 pt-1 grid grid-cols-3 gap-2">
            <StatCard
              value={studyStreak}
              unit="天"
              label="坚持学习"
              borderColor="#88CCFF"
              icon={<Flame size={16} className="text-orange-400" />}
            />
            <StatCard
              value={todayAnswered}
              unit="题"
              label="今日答题数"
              borderColor="#88CCFF"
              icon={<Target size={16} className="text-blue-400" />}
            />
            <StatCard
              value={accuracy}
              unit="%"
              label="正确率"
              borderColor="#88CCFF"
              icon={<TrendingUp size={16} className="text-green-400" />}
            />
          </div>
        </div>

        {/* 学科卡片网格 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {textbooks.map((tb) => {
            const info = SUBJECTS[tb.subject];
            const totalAnswered = subjectTotalAnswered[tb.subject] || 0;
            const totalCorrect = subjectTotalCorrect[tb.subject] || 0;
            const rate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
            const selectedVer = selectedVersions[tb.subject] || realVersions[tb.subject]?.[0] || tb.versions[0];
            const isOpen = versionPickerFor === tb.subject;
            const versionsToShow = realVersions[tb.subject] || tb.versions;

            return (
              <div
                key={tb.subject}
                className="rounded-2xl p-3 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${info.color}10, ${info.color}05)` }}
              >
                {/* 顶部：图标 + 学科名 */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: info.color, boxShadow: `0 3px 8px ${info.color}40` }}
                  >
                    <img
                      src={SUBJECT_ICONS[tb.subject]}
                      alt={info.name}
                      className="w-9 h-9 object-contain"
                    />
                  </div>
                  <span className="font-alibaba font-black text-[22px] text-gray-800 leading-none">
                    {info.name}
                  </span>
                </div>

                {/* 已学习 xx 道题 */}
                <p className="font-alibaba text-[14px] text-gray-500 mb-1">
                  已学习 <span className="font-bold text-[20px] text-gray-700">{totalAnswered}</span> 道题
                </p>

                {/* 进度条 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: `${info.color}20` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(rate, 100)}%`,
                        background: `linear-gradient(90deg, ${info.color}CC, ${info.color})`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-alibaba text-gray-500 flex-shrink-0">{rate}%</span>
                </div>
                <p className="text-[10px] font-alibaba text-gray-400 mb-2 text-right -mt-1">正确率</p>

                {/* 去学习按钮 */}
                <button
                  onClick={() => handleStartLearn(tb.subject)}
                  className="w-full py-1.5 rounded-full text-[14px] font-alibaba font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                  style={{ color: "#2244AA" }}
                >
                  去学习 <ChevronRight size={16} style={{ color: "#2244AA" }} />
                </button>

                {/* 版本选择（点击版本标签弹出） */}
                <div className="relative mt-1">
                  {isOpen && (
                    <div className="absolute bottom-full left-0 right-0 z-30 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 p-2 max-h-48 overflow-y-auto animate-fade-in">
                      {versionsToShow.map((v) => {
                        const active = v === selectedVer;
                        return (
                          <button
                            key={v}
                            onClick={() => handleSelectVersion(tb.subject, v)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-alibaba flex items-center gap-1 ${
                              active ? "font-bold" : ""
                            }`}
                            style={{ color: active ? info.color : "#666" }}
                          >
                            {active && <Check size={12} />}
                            <span className="truncate">{v}</span>
                          </button>
                        );
                      })}
                      <button onClick={() => setVersionPickerFor(null)} className="w-full text-center py-1 text-[10px] text-gray-400 mt-1">
                        <X size={12} className="inline" /> 关闭
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setVersionPickerFor(isOpen ? null : tb.subject)}
                    className="w-full text-center text-[10px] font-alibaba text-gray-400 py-0.5 truncate"
                  >
                    {selectedVer || "选择版本"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  unit,
  label,
  borderColor,
  icon,
}: {
  value: number;
  unit: string;
  label: string;
  borderColor: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center py-3 px-1 relative"
      style={{
        background: "linear-gradient(180deg, #F0F7FF, #E0EEFF)",
        borderBottom: `3px solid ${borderColor}`,
        borderRight: `2px solid ${borderColor}30`,
        borderBottomRightRadius: "16px",
      }}
    >
      {icon && <div className="mb-0.5">{icon}</div>}
      <div className="flex items-baseline gap-0.5">
        <span className="font-alibaba font-black text-[36px] leading-none" style={{ color: "#1A1A1A", fontStyle: "italic" }}>
          {value}
        </span>
        <span className="font-alibaba font-bold text-[16px] text-gray-600">{unit}</span>
      </div>
      <span className="text-[13px] font-alibaba text-gray-500 mt-1">{label}</span>
    </div>
  );
}
