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

// 兜底默认配置（store 持久化数据未加载时使用）
const FALLBACK = {
  pageBg: "#F0F4FF",
  topGradientFrom: "#3B76F7",
  topGradientMid: "#3559E8",
  topGradientTo: "#2D4CE3",
  topPaddingBottom: 12,
  brandHeight: 72,
  brandPaddingX: 16,
  brandPaddingTop: 12,
  carouselMarginX: 16,
  carouselMarginTop: 12,
  carouselRadius: 16,
  carouselAspect: "8/3",
  contentMarginTop: -16,
  contentPaddingX: 16,
  contentPaddingBottom: 96,
  cardBg: "#FFFFFF",
  cardRadius: 16,
  cardShadow: "0 2px 12px rgba(0,0,0,0.06)",
  gradeIconSrc: "/images/ss.png",
  gradeIconSize: 32,
  gradeTitleText: "所学年级",
  gradeTitleSize: 18,
  gradeTitleColor: "#1F2937",
  gradeBtnFrom: "#2266FF",
  gradeBtnTo: "#3388FF",
  gradeBtnRadius: 28,
  gradeBtnTextSize: 16,
  gradeBtnPaddingX: 20,
  gradeBtnPaddingY: 12,
  statBorderColor: "#88CCFF",
  statBgFrom: "#F0F7FF",
  statBgTo: "#E0EEFF",
  statNumberSize: 36,
  statNumberColor: "#1A1A1A",
  statUnitSize: 16,
  statUnitColor: "#4B5563",
  statLabelSize: 13,
  statLabelColor: "#6B7280",
  statGridGap: 8,
  statGridPaddingX: 12,
  statGridPaddingBottom: 16,
  subjectCardGap: 12,
  subjectCardPadding: 12,
  subjectCardRadius: 16,
  subjectIconSize: 44,
  subjectIconRadius: 16,
  subjectIconImgSize: 36,
  subjectNameSize: 22,
  subjectNameColor: "#1F2937",
  subjectLearnedSize: 14,
  subjectLearnedColor: "#6B7280",
  subjectLearnedNumSize: 20,
  subjectLearnedNumColor: "#374151",
  subjectProgressHeight: 10,
  subjectProgressRadius: 999,
  subjectRateSize: 11,
  subjectRateColor: "#6B7280",
  subjectBtnColor: "#2244AA",
  subjectBtnSize: 14,
  subjectVersionSize: 10,
  subjectVersionColor: "#9CA3AF",
};

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
    homeDesign,
  } = useStore();
  const c = { ...FALLBACK, ...homeDesign };
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
    <div className="min-h-full relative" style={{ background: c.pageBg }}>
      {/* 顶部蓝色渐变区域 */}
      <div className="relative" style={{ background: `linear-gradient(180deg, ${c.topGradientFrom} 0%, ${c.topGradientMid} 50%, ${c.topGradientTo} 100%)`, paddingBottom: c.topPaddingBottom }}>
        {/* 左上角品牌图 ac.png */}
        <div style={{ paddingLeft: c.brandPaddingX, paddingRight: c.brandPaddingX, paddingTop: c.brandPaddingTop }}>
          <img src="/images/ac.png" alt="识途EVO" style={{ height: c.brandHeight, width: "auto", objectFit: "contain" }} />
        </div>

        {/* 轮播图（slide1/2/3.jpg） */}
        <div style={{ marginLeft: c.carouselMarginX, marginRight: c.carouselMarginX, marginTop: c.carouselMarginTop, borderRadius: c.carouselRadius, overflow: "hidden", position: "relative", aspectRatio: c.carouselAspect, background: "#1a1a3e" }}>
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

      {/* 内容区域 */}
      <div className="relative z-10" style={{ paddingLeft: c.contentPaddingX, paddingRight: c.contentPaddingX, marginTop: c.contentMarginTop, paddingBottom: c.contentPaddingBottom }}>
        {/* 所学年级 + 统计卡片 */}
        <div className="overflow-hidden" style={{ background: c.cardBg, borderRadius: c.cardRadius, boxShadow: c.cardShadow }}>
          {/* 所学年级标题栏 */}
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2 px-4 py-3">
              <img src={c.gradeIconSrc} alt="所学年级" style={{ height: c.gradeIconSize, width: c.gradeIconSize, objectFit: "contain" }} />
              <span className="font-alibaba font-bold" style={{ fontSize: c.gradeTitleSize, color: c.gradeTitleColor }}>{c.gradeTitleText}</span>
            </div>
            <button
              onClick={() => setGradeSelectorOpen(!gradeSelectorOpen)}
              className="relative flex items-center gap-1"
              style={{ background: `linear-gradient(90deg, ${c.gradeBtnFrom}, ${c.gradeBtnTo})`, borderBottomLeftRadius: c.gradeBtnRadius, paddingLeft: c.gradeBtnPaddingX, paddingRight: c.gradeBtnPaddingX, paddingTop: c.gradeBtnPaddingY, paddingBottom: c.gradeBtnPaddingY }}
            >
              <span className="font-alibaba font-bold text-white" style={{ fontSize: c.gradeBtnTextSize }}>{selectedGrade}</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: c.statGridGap, paddingLeft: c.statGridPaddingX, paddingRight: c.statGridPaddingX, paddingBottom: c.statGridPaddingBottom, paddingTop: 4 }}>
            <StatCard
              value={studyStreak}
              unit="天"
              label="坚持学习"
              icon={<Flame size={16} className="text-orange-400" />}
              c={c}
            />
            <StatCard
              value={todayAnswered}
              unit="题"
              label="今日答题数"
              icon={<Target size={16} className="text-blue-400" />}
              c={c}
            />
            <StatCard
              value={accuracy}
              unit="%"
              label="正确率"
              icon={<TrendingUp size={16} className="text-green-400" />}
              c={c}
            />
          </div>
        </div>

        {/* 学科卡片网格 */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: c.subjectCardGap }}>
          {textbooks.map((tb) => {
            const info = SUBJECTS[tb.subject];
            const subDesign = c.subjects?.[tb.subject];
            const subColor = subDesign?.color || info.color;
            const subName = subDesign?.name || info.name;
            const subIcon = subDesign?.icon || SUBJECT_ICONS[tb.subject];
            const totalAnswered = subjectTotalAnswered[tb.subject] || 0;
            const totalCorrect = subjectTotalCorrect[tb.subject] || 0;
            const rate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
            const selectedVer = selectedVersions[tb.subject] || realVersions[tb.subject]?.[0] || tb.versions[0];
            const isOpen = versionPickerFor === tb.subject;
            const versionsToShow = realVersions[tb.subject] || tb.versions;

            return (
              <div
                key={tb.subject}
                className="relative overflow-hidden"
                style={{ borderRadius: c.subjectCardRadius, padding: c.subjectCardPadding, background: `linear-gradient(135deg, ${subColor}10, ${subColor}05)` }}
              >
                {/* 顶部：图标 + 学科名 */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ width: c.subjectIconSize, height: c.subjectIconSize, borderRadius: c.subjectIconRadius, background: subColor, boxShadow: `0 3px 8px ${subColor}40` }}
                  >
                    <img src={subIcon} alt={subName} style={{ width: c.subjectIconImgSize, height: c.subjectIconImgSize, objectFit: "contain" }} />
                  </div>
                  <span className="font-alibaba font-black leading-none" style={{ fontSize: c.subjectNameSize, color: c.subjectNameColor }}>
                    {subName}
                  </span>
                </div>

                {/* 已学习 xx 道题 */}
                <p className="font-alibaba mb-1" style={{ fontSize: c.subjectLearnedSize, color: c.subjectLearnedColor }}>
                  已学习 <span className="font-bold" style={{ fontSize: c.subjectLearnedNumSize, color: c.subjectLearnedNumColor }}>{totalAnswered}</span> 道题
                </p>

                {/* 进度条 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: c.subjectProgressHeight, borderRadius: c.subjectProgressRadius, background: `${subColor}20` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(rate, 100)}%`, borderRadius: c.subjectProgressRadius, background: `linear-gradient(90deg, ${subColor}CC, ${subColor})` }}
                    />
                  </div>
                  <span className="font-alibaba flex-shrink-0" style={{ fontSize: c.subjectRateSize, color: c.subjectRateColor }}>{rate}%</span>
                </div>
                <p className="font-alibaba text-right -mt-1 mb-2" style={{ fontSize: 10, color: c.subjectVersionColor }}>正确率</p>

                {/* 去学习按钮 */}
                <button
                  onClick={() => handleStartLearn(tb.subject)}
                  className="w-full rounded-full font-alibaba font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                  style={{ padding: "6px 0", borderRadius: 999, fontSize: c.subjectBtnSize, color: c.subjectBtnColor }}
                >
                  去学习 <ChevronRight size={16} style={{ color: c.subjectBtnColor }} />
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
                    className="w-full text-center font-alibaba py-0.5 truncate"
                    style={{ fontSize: c.subjectVersionSize, color: c.subjectVersionColor }}
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
  icon,
  c,
}: {
  value: number;
  unit: string;
  label: string;
  icon?: React.ReactNode;
  c: typeof FALLBACK;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center relative"
      style={{
        borderRadius: 16,
        padding: "12px 4px",
        background: `linear-gradient(180deg, ${c.statBgFrom}, ${c.statBgTo})`,
        borderBottom: `3px solid ${c.statBorderColor}`,
        borderRight: `2px solid ${c.statBorderColor}30`,
        borderBottomRightRadius: 16,
      }}
    >
      {icon && <div className="mb-0.5">{icon}</div>}
      <div className="flex items-baseline gap-0.5">
        <span className="font-alibaba font-black leading-none" style={{ fontSize: c.statNumberSize, color: c.statNumberColor, fontStyle: "italic" }}>
          {value}
        </span>
        <span className="font-alibaba font-bold" style={{ fontSize: c.statUnitSize, color: c.statUnitColor }}>{unit}</span>
      </div>
      <span className="font-alibaba mt-1" style={{ fontSize: c.statLabelSize, color: c.statLabelColor }}>{label}</span>
    </div>
  );
}
