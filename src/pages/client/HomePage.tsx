import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getTextbooksByGrade, SUBJECTS } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import { fetchVersions } from "@/lib/api";
import type { Subject } from "@/data/types";

const IMG_VER = "20260819";

const SUBJECT_ICONS: Record<string, string> = {
  physics: `/images/icon-physics.png?v=${IMG_VER}`,
  chemistry: `/images/icon-chemistry.jpg?v=${IMG_VER}`,
  biology: `/images/icon-biology.png?v=${IMG_VER}`,
  history: `/images/icon-history.png?v=${IMG_VER}`,
  politics: `/images/icon-politics.png?v=${IMG_VER}`,
  geography: `/images/icon-geography.png?v=${IMG_VER}`,
};

const SLIDES = [
  `/images/slide1.jpg?v=${IMG_VER}`,
  `/images/slide2.jpg?v=${IMG_VER}`,
  `/images/slide3.jpg?v=${IMG_VER}`,
];

// 兜底默认配置（store 持久化数据未加载时使用）
const FALLBACK = {
  pageBg: "#FFFFFF",
  // 顶部三色蓝交错渐变
  topGradientFrom: "#3B76F7",
  topGradientMid: "#3559E8",
  topGradientTo: "#2D4CE3",
  // 品牌
  brandHeight: 72,
  brandText: "AI智能题库",
  brandFontSize: 30,
  brandLetterSpacing: 3,
  brandColor: "#FFFFFF",
  brandPaddingX: 16,
  brandPaddingTop: 12,
  // 轮播
  carouselMarginX: 16,
  carouselMarginTop: 44, // 下移 1/4 轮播高度（约32px）
  carouselRadius: 16,
  carouselAspect: "8/3",
  // 内容
  contentMarginTop: -20,
  contentPaddingX: 16,
  contentPaddingBottom: 96,
  // 白色大卡片（学科外层底板）
  cardBg: "#FFFFFF",
  cardRadius: 20,
  cardShadow: "0 4px 20px rgba(0,0,0,0.08)",
  // 所学年级
  gradeIconSrc: "/images/ss.png",
  gradeIconSize: 28,
  gradeTitleText: "所学年级",
  gradeTitleSize: 16,
  gradeTitleColor: "#1F2937",
  gradePaddingY: 8,
  gradePaddingX: 16,
  // 学段按钮（更设计感）
  gradeBtnFrom: "#2266FF",
  gradeBtnTo: "#3388FF",
  gradeBtnRadius: 24,
  gradeBtnTextSize: 6, // 字号再缩小2个字号
  gradeBtnPaddingX: 81, // 往左延伸1/2
  gradeBtnPaddingY: 1, // 往上缩短1/2
  gradeBtnShadow: "0 4px 12px rgba(34,102,255,0.35)",
  // 统计卡片（缩小版）
  statBorderColor: "#3B76F7",
  statBgFrom: "#F0F7FF",
  statBgTo: "#E0EEFF",
  statNumberSize: 26,
  statNumberColor: "#1A1A1A",
  statUnitSize: 12,
  statUnitColor: "#4B5563",
  statLabelSize: 11,
  statLabelColor: "#6B7280",
  statGridGap: 8,
  statGridPaddingX: 48, // 左右缩短1/4
  statGridPaddingBottom: 12,
  statGridPaddingTop: 6,
  // 学科卡片
  subjectCardGap: 10,
  subjectCardPadding: 10,
  subjectCardRadius: 14,
  subjectIconSize: 38,
  subjectIconRadius: 12,
  subjectIconImgSize: 30,
  subjectNameSize: 18,
  subjectNameColor: "#1F2937",
  subjectLearnedSize: 12,
  subjectLearnedColor: "#6B7280",
  subjectLearnedNumSize: 16,
  subjectLearnedNumColor: "#374151",
  subjectProgressHeight: 14,
  subjectProgressRadius: 999,
  subjectProgressBg: "#EEF2F7", // 进度条空槽统一灰
  subjectRateSize: 10,
  subjectRateColor: "#FFFFFF",
  subjectRateLabelSize: 10,
  subjectRateLabelColor: "#6B7280",
  subjectBtnColor: "#2244AA",
  subjectBtnSize: 13,
  subjectBtnBg: "#F0F4FF",
  subjectBtnRadius: 999,
  subjectBtnPaddingX: 12,
  subjectBtnPaddingY: 6,
  // 版本网格（在所学年级内）
  versionGridGap: 6,
  versionGridCols: 3,
  versionFontSize: 10,
  versionLabelSize: 9,
  versionActiveColor: "#3B76F7",
  versionBg: "#F8FAFC",
  versionBorderColor: "#E5E7EB",
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

  // 生成锯齿状 clip-path（统计卡片上边）
  const zigzagClip = (() => {
    const teeth = 14;
    const h = 5;
    const points: string[] = [];
    for (let i = 0; i <= teeth * 2; i++) {
      const x = (i / (teeth * 2)) * 100;
      const y = i % 2 === 0 ? h : 0;
      points.push(`${x.toFixed(2)}% ${y}px`);
    }
    points.push(`100% ${h}px`);
    points.push(`100% 100%`);
    points.push(`0 100%`);
    return `polygon(${points.join(", ")})`;
  })();

  return (
    <div className="min-h-full relative" style={{
      background: `linear-gradient(180deg, ${c.topGradientFrom} 0%, ${c.topGradientMid} 8%, ${c.topGradientTo} 16%, #EEF3FF 20%, ${c.pageBg} 25%)`,
    }}>
      {/* 顶部蓝色区域 + 轮播 */}
      <div className="relative" style={{ paddingBottom: 60 }}>
        {/* 左上角品牌 — AI 设计感（双色字 + 渐变描边 + 阴影） */}
        <div style={{ paddingLeft: c.brandPaddingX, paddingRight: c.brandPaddingX, paddingTop: c.brandPaddingTop, paddingBottom: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
          {/* "AI" 双色：A 渐变填充，I 用亮青色 */}
          <span
            className="font-alibaba"
            style={{
              fontSize: c.brandFontSize,
              fontWeight: 900,
              lineHeight: 1,
              background: "linear-gradient(135deg, #FFFFFF 0%, #B0D0FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.25))",
              letterSpacing: 2,
            }}
          >
            AI
          </span>
          {/* "智能题库" 白色实心 */}
          <span
            className="font-alibaba"
            style={{
              fontSize: c.brandFontSize - 6,
              fontWeight: 800,
              color: c.brandColor,
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
              lineHeight: 1,
              letterSpacing: c.brandLetterSpacing,
            }}
          >
            智能题库
          </span>
        </div>

        {/* 轮播图 */}
        <div style={{ marginLeft: c.carouselMarginX, marginRight: c.carouselMarginX, marginTop: c.carouselMarginTop, borderRadius: c.carouselRadius, overflow: "hidden", position: "relative", aspectRatio: c.carouselAspect, background: "#1a1a3e", boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>
          {SLIDES.map((src, i) => (
            <div key={src} className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIndex ? "opacity-100" : "opacity-0"}`}>
              <img src={src} alt={`轮播 ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
          <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
            {SLIDES.map((_, i) => (
              <span key={i} className={`carousel-dot ${i === bannerIndex ? "active" : ""}`} onClick={() => setBannerIndex(i)} />
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="relative z-10" style={{ paddingLeft: c.contentPaddingX, paddingRight: c.contentPaddingX, marginTop: c.contentMarginTop, paddingBottom: c.contentPaddingBottom }}>
        {/* 所学年级 + 统计卡片（外层白底圆角） */}
        <div className="overflow-hidden" style={{ background: c.cardBg, borderRadius: c.cardRadius, boxShadow: c.cardShadow }}>
          {/* 所学年级标题栏 — 上下缩短 */}
          <div className="relative" style={{ padding: `${c.gradePaddingY}px ${c.gradePaddingX}px` }}>
            <div className="flex items-center gap-2">
              <img src={c.gradeIconSrc} alt="所学年级" style={{ height: c.gradeIconSize, width: c.gradeIconSize, objectFit: "contain" }} />
              <span className="font-alibaba font-bold" style={{ fontSize: c.gradeTitleSize, color: c.gradeTitleColor }}>{c.gradeTitleText}</span>
            </div>
            {/* 学段按钮 — 绝对定位贴紧右上角 */}
            <button
              onClick={() => navigate("/app/grade-select")}
              className="flex items-center gap-1"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: `linear-gradient(90deg, ${c.gradeBtnFrom}, ${c.gradeBtnTo})`,
                borderTopRightRadius: c.cardRadius,
                borderBottomLeftRadius: c.gradeBtnRadius,
                paddingLeft: c.gradeBtnPaddingX,
                paddingRight: c.gradeBtnPaddingX,
                paddingTop: c.gradeBtnPaddingY,
                paddingBottom: c.gradeBtnPaddingY,
                boxShadow: c.gradeBtnShadow,
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              <span className="font-alibaba font-bold text-white" style={{ fontSize: c.gradeBtnTextSize }}>{selectedGrade}</span>
              <ChevronDown size={12} color="#fff" />
            </button>
          </div>

          {/* 三个统计卡片 — 缩小、去图标、锯齿上边、右下白翻折、底部蓝不变 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: c.statGridGap, paddingLeft: c.statGridPaddingX, paddingRight: c.statGridPaddingX, paddingBottom: c.statGridPaddingBottom, paddingTop: c.statGridPaddingTop }}>
            <StatCard value={studyStreak} unit="天" label="坚持学习" zigzagClip={zigzagClip} c={c} />
            <StatCard value={todayAnswered} unit="题" label="今日答题" zigzagClip={zigzagClip} c={c} />
            <StatCard value={accuracy} unit="%" label="正确率" zigzagClip={zigzagClip} c={c} />
          </div>
        </div>

        {/* 学科外层白色大圆角底板 */}
        <div style={{ marginTop: 16, background: "#FFFFFF", borderRadius: c.cardRadius, boxShadow: c.cardShadow, padding: 12 }}>
          {/* 学科卡片网格 — 左右内缩1/6（约26px）确保间隔 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: c.subjectCardGap, paddingLeft: 13, paddingRight: 13 }}>
            {textbooks.map((tb) => {
              const info = SUBJECTS[tb.subject];
              const subDesign = c.subjects?.[tb.subject];
              const subColor = subDesign?.color || info.color;
              const subName = subDesign?.name || info.name;
              // icon 路径始终用常量（文件名固定），忽略 store 旧持久化数据，避免缓存
              const subIcon = SUBJECT_ICONS[tb.subject];
              const totalAnswered = subjectTotalAnswered[tb.subject] || 0;
              const totalCorrect = subjectTotalCorrect[tb.subject] || 0;
              const rate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
              // 所有学科底板统一使用物理色
              const cardBgColor = SUBJECTS.physics.color;
              // 进度条统一天青色
              const progressColor = "#06B6D4";
              // 去学习按钮统一蓝紫色
              const btnColor = "#6366F1";
              return (
                <div
                  key={tb.subject}
                  className="relative overflow-hidden"
                  style={{
                    borderRadius: c.subjectCardRadius,
                    // 上下 padding 缩短 1/6（0.8 → 约0.67）
                    padding: `${Math.round(c.subjectCardPadding * 0.67)}px ${c.subjectCardPadding}px`,
                    background: `linear-gradient(135deg, ${cardBgColor}10, ${cardBgColor}05)`,
                  }}
                >
                  {/* 顶部：图标 + 学科名 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ width: c.subjectIconSize, height: c.subjectIconSize, borderRadius: c.subjectIconRadius, background: subColor, boxShadow: `0 3px 8px ${subColor}40` }}
                    >
                      <img src={subIcon} alt={subName} style={{ width: c.subjectIconImgSize, height: c.subjectIconImgSize, objectFit: "cover", transform: "scale(1.3)" }} />
                    </div>
                    <span className="font-alibaba font-black leading-none" style={{ fontSize: c.subjectNameSize, color: c.subjectNameColor }}>
                      {subName}
                    </span>
                  </div>

                  {/* 已学习 xx 道题 — 数字用蓝色 */}
                  <p className="font-alibaba mb-1.5" style={{ fontSize: c.subjectLearnedSize, color: c.subjectLearnedColor }}>
                    已学习 <span className="font-bold" style={{ fontSize: c.subjectLearnedNumSize, color: "#3B76F7" }}>{totalAnswered}</span> 道题
                  </p>

                  {/* 进度条 — 天青色 + 内嵌百分比 */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 relative overflow-hidden" style={{ height: c.subjectProgressHeight, borderRadius: c.subjectProgressRadius, background: c.subjectProgressBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(rate, 100)}%`, borderRadius: c.subjectProgressRadius, background: `linear-gradient(90deg, ${progressColor}CC, ${progressColor})` }}
                      />
                      <span
                        className="font-alibaba absolute flex items-center justify-center"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          fontSize: c.subjectRateSize,
                          color: c.subjectRateColor,
                          fontWeight: 700,
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          lineHeight: 1,
                        }}
                      >
                        {rate}%
                      </span>
                    </div>
                    <span className="font-alibaba flex-shrink-0" style={{ fontSize: c.subjectRateLabelSize, color: c.subjectRateLabelColor, lineHeight: 1.5 }}>正确率</span>
                  </div>

                  {/* 去学习按钮 — 蓝紫色 + 圆角底框 */}
                  <div className="flex items-center justify-start mt-2">
                    <button
                      onClick={() => handleStartLearn(tb.subject)}
                      className="flex items-center gap-1 transition-all active:scale-95"
                      style={{
                        background: "#EEF0FF",
                        color: btnColor,
                        borderRadius: c.subjectBtnRadius,
                        paddingLeft: c.subjectBtnPaddingX,
                        paddingRight: c.subjectBtnPaddingX,
                        paddingTop: c.subjectBtnPaddingY,
                        paddingBottom: c.subjectBtnPaddingY,
                        fontSize: c.subjectBtnSize,
                        fontWeight: 700,
                      }}
                    >
                      去学习 <ChevronRight size={14} style={{ color: btnColor }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  unit,
  label,
  zigzagClip,
  c,
}: {
  value: number;
  unit: string;
  label: string;
  zigzagClip: string;
  c: typeof FALLBACK;
}) {
  return (
    <div style={{ position: "relative" }}>
      {/* 主卡片：锯齿上边 + 底部蓝边 + 右下白色翻折（通过 clip-path 切角） */}
      <div
        style={{
          background: `linear-gradient(180deg, ${c.statBgFrom}, ${c.statBgTo})`,
          borderBottom: `3px solid ${c.statBorderColor}`,
          padding: "10px 4px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          clipPath: zigzagClip,
          position: "relative",
        }}
      >
        <div className="flex items-baseline gap-0.5">
          <span className="font-alibaba font-black leading-none" style={{ fontSize: c.statNumberSize, color: c.statNumberColor, fontStyle: "italic" }}>
            {value}
          </span>
          <span className="font-alibaba font-bold" style={{ fontSize: c.statUnitSize, color: c.statUnitColor }}>{unit}</span>
        </div>
        <span className="font-alibaba mt-0.5" style={{ fontSize: c.statLabelSize, color: c.statLabelColor }}>{label}</span>
      </div>
      {/* 右下白色翻折效果 — 三角形覆盖右下角 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: "0 0 10px 10px",
          borderColor: `transparent transparent #FFFFFF transparent`,
          filter: "drop-shadow(-1px -1px 0 rgba(0,0,0,0.04))",
        }}
      />
    </div>
  );
}
