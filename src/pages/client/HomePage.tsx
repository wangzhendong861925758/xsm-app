import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Flame, Target, TrendingUp, BookOpen, Check } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { SUBJECT_TODAY_COUNT } from "@/data/mock";
import { GRADES, getTextbooksByGrade, SUBJECTS } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import { fetchVersions } from "@/lib/api";
import type { Subject } from "@/data/types";

export default function HomePage() {
  const navigate = useNavigate();
  const {
    selectedGrade,
    setSelectedGrade,
    todayLearned,
    todayStats,
    studyDates,
    siteConfig,
    selectedVersions,
    setSelectedVersion,
    clientAccounts,
    currentClientCode,
    checkAndRevokeExpired,
  } = useStore();
  const account = clientAccounts.find((a) => a.code === currentClientCode);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [gradePanelOpen, setGradePanelOpen] = useState(false);
  const [openVersionFor, setOpenVersionFor] = useState<Subject | null>(null);

  const carousel = siteConfig.carousel;

  // 真实统计数据
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

  useEffect(() => {
    if (carousel.length === 0) return;
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % carousel.length);
    }, 4000);
    return () => clearInterval(t);
  }, [carousel.length]);

  const textbooks = getTextbooksByGrade(selectedGrade);

  // 从 manifest 拉取各学科+年级的真实教材版本（覆盖 textbooks.ts 的硬编码）
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

  const handleGradeClick = (grade: string) => {
    setSelectedGrade(grade);
    setGradePanelOpen(false);
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
    setOpenVersionFor(null);
  };

  // 当前年级展示名
  const currentGradeShort = GRADES.find((g) => g.key === selectedGrade)?.short || selectedGrade;

  return (
    <div
      className="min-h-full relative"
      style={{
        background: "linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 8%, #D6ECFF 25%, #A3D8FF 42%, #66C2FF 60%, #2BB0FF 78%, #0099FF 95%, #0088FF 100%)",
      }}
    >
      {/* 板块一：毛笔字标题 */}
      <header className="relative px-5 pt-6 pb-3 flex items-center justify-between">
        <BrushTitle size="lg" text={siteConfig.brandName} seal={siteConfig.heroBadge} />
        <span className="text-[10px] text-navy-800/60 font-alibaba">识途EVO</span>
      </header>

      {/* 板块二：横屏轮播图 */}
      <section className="relative px-5 mb-4">
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-card bg-navy-100">
          {carousel.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === carouselIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              {img.url && (
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy-900/70 to-transparent p-3">
                <p className="text-paper font-alibaba text-sm">{img.title}</p>
              </div>
            </div>
          ))}
          <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
            {carousel.map((_, i) => (
              <span
                key={i}
                className={`carousel-dot ${i === carouselIndex ? "active" : ""}`}
                onClick={() => setCarouselIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 板块三：折叠式学段选择器 + 学习概况 */}
      <section className="relative px-5 mb-4">
        <div className="ink-card rounded-2xl overflow-hidden">
          <button
            onClick={() => setGradePanelOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-navy-600" />
              <div className="text-left">
                <p className="font-alibaba text-sm font-bold text-navy-900 leading-none">
                  当前学段 · {currentGradeShort}
                </p>
                <p className="text-[10px] text-navy-800/50 mt-0.5 font-alibaba">{selectedGrade}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-navy-800/50">
              <span className="text-[10px] font-alibaba">{gradePanelOpen ? "收起" : "切换年级"}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${gradePanelOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {gradePanelOpen && (
            <div className="px-4 pb-3 pt-1 border-t border-navy-500/8 animate-fade-in">
              <p className="text-[10px] text-navy-800/50 font-alibaba mb-2 mt-2">初中 · 7-9 年级</p>
              <div className="grid grid-cols-3 gap-2">
                {GRADES.map((g) => {
                  const active = selectedGrade === g.key;
                  return (
                    <button
                      key={g.key}
                      onClick={() => handleGradeClick(g.key)}
                      className={`px-2 py-2 rounded-xl text-xs font-alibaba border transition-all flex flex-col items-center ${
                        active
                          ? "bg-navy-600 text-paper border-navy-600 shadow-seal"
                          : "bg-paper text-navy-900 border-navy-500/15 hover:border-navy-500/40"
                      }`}
                    >
                      <span className="font-bold">{g.short}</span>
                      <span className={`text-[9px] mt-0.5 ${active ? "opacity-80" : "opacity-50"}`}>{g.phase}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 ink-card rounded-2xl p-3">
          <div className="flex flex-col items-center">
            <Flame size={18} className="text-navy-500 mb-1" />
            <span className="font-alibaba font-bold text-2xl text-navy-900 leading-none">
              {studyStreak}
            </span>
            <span className="text-[10px] text-navy-800/50 mt-1 font-alibaba">坚持天数</span>
          </div>
          <div className="flex flex-col items-center border-x border-navy-500/10">
            <Target size={18} className="text-navy-500 mb-1" />
            <span className="font-alibaba font-bold text-2xl text-navy-900 leading-none">
              {todayAnswered}
            </span>
            <span className="text-[10px] text-navy-800/50 mt-1 font-alibaba">今日答题</span>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp size={18} className="text-navy-600 mb-1" />
            <span className="font-alibaba font-bold text-2xl text-navy-900 leading-none">
              {accuracy}
              <span className="text-sm">%</span>
            </span>
            <span className="text-[10px] text-navy-800/50 mt-1 font-alibaba">正确率</span>
          </div>
        </div>
      </section>

      {/* 板块四：学科入口 */}
      <section className="relative px-5 pb-6">
        <h2 className="font-alibaba text-base font-bold text-white mb-3 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full bg-white/80" />
          学科学习
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {textbooks.map((tb) => {
            const info = SUBJECTS[tb.subject];
            const todayCount = todayLearned[tb.subject] || 0;
            const stat = todayStats[tb.subject] || { correct: 0, total: 0 };
            const rate = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            const selectedVer = selectedVersions[tb.subject] || realVersions[tb.subject]?.[0] || tb.versions[0];
            const isOpen = openVersionFor === tb.subject;
            const versionsToShow = realVersions[tb.subject] || tb.versions;

            return (
              <div
                key={tb.subject}
                className="bg-white rounded-3xl relative shadow-card p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="pt-1 pl-1">
                    <p className="font-alibaba text-xl font-bold leading-none text-black">
                      {info.name}
                    </p>
                    <p className="text-[10px] mt-2 font-alibaba text-gray-500">
                      今日 <span className="font-bold text-lg text-black">{todayCount}</span>
                      <span className="text-[10px]"> 题</span>
                    </p>
                  </div>
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${info.color}15`, color: info.color }}
                  >
                    {info.icon}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${info.color}20` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stat.total > 0 ? rate : 0}%`,
                        background: info.color,
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-alibaba flex-shrink-0" style={{ color: info.color }}>
                    {stat.total > 0 ? `${rate}%` : "未练"}
                  </span>
                </div>

                <button
                  onClick={() => handleStartLearn(tb.subject)}
                  className="w-full py-2 rounded-xl text-xs font-alibaba font-bold flex items-center justify-center gap-1 transition-all active:scale-95 mb-1"
                  style={{
                    background: info.color,
                    color: "#fff",
                  }}
                >
                  去学习 <ChevronRight size={13} />
                </button>

                <button
                  onClick={() => setOpenVersionFor(isOpen ? null : tb.subject)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl"
                  style={{ background: `${info.color}08` }}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <BookOpen size={11} style={{ color: info.color }} className="flex-shrink-0" />
                    <span
                      className="text-[10px] font-alibaba font-bold px-1.5 py-0.5 rounded truncate"
                      style={{ background: `${info.color}12`, color: info.color }}
                    >
                      {selectedVer}
                    </span>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: info.color }}
                  />
                </button>

                {isOpen && (
                  <div className="absolute left-0 right-0 bottom-full z-20 mb-1 px-2.5 py-2 bg-white rounded-2xl shadow-card border animate-fade-in" style={{ borderColor: `${info.color}30` }}>
                    <div className="grid grid-cols-1 gap-1">
                      {versionsToShow.map((v) => {
                        const active = v === selectedVer;
                        return (
                          <button
                            key={v}
                            onClick={() => handleSelectVersion(tb.subject, v)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-alibaba border transition-all text-left ${
                              active
                                ? "text-white border-transparent"
                                : "bg-white hover:border-navy-500/40"
                            }`}
                            style={active ? { background: info.color, borderColor: info.color } : { color: info.color, borderColor: `${info.color}20` }}
                          >
                            {active && <Check size={10} className="flex-shrink-0" />}
                            <span className="truncate">{v}</span>
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
      </section>
    </div>
  );
}
