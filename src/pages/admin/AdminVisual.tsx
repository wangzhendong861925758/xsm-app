import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Type, Image as ImageIcon, Eye, RotateCcw, Plus, Trash2, Save, Smartphone,
  Flame, Target, TrendingUp, BookOpen, ChevronRight, ChevronDown,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { CarouselItem } from "@/store/useStore";
import { SUBJECTS, getTextbooksByGrade } from "@/data/textbooks";
import BrushTitle from "@/components/BrushTitle";

// 客户端实际使用的 navy 色系（来自 tailwind.config.js）
const NAVY_500 = "#0EA5E9";
const NAVY_600 = "#0284C7";

export default function AdminVisual() {
  const navigate = useNavigate();
  const { siteConfig, updateSiteConfig, resetSiteConfig } = useStore();
  const [draft, setDraft] = useState(siteConfig);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSiteConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleReset = () => {
    if (confirm("确认恢复默认配置？所有改动将丢失。")) {
      resetSiteConfig();
      setDraft(useStore.getState().siteConfig);
    }
  };

  const updateCarouselItem = (i: number, patch: Partial<CarouselItem>) => {
    const next = [...draft.carousel];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, carousel: next });
  };

  const addCarouselItem = () => {
    setDraft({
      ...draft,
      carousel: [
        ...draft.carousel,
        { url: "", title: "新轮播图" },
      ],
    });
  };

  const removeCarouselItem = (i: number) => {
    setDraft({ ...draft, carousel: draft.carousel.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="brush-title text-3xl text-navy-900 mb-1">可视化配置</h1>
          <p className="font-kai text-xs text-navy-800/60">编辑站点外观与内容，保存后实时同步到所有客户端标签页</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-navy-500/15 text-navy-900 font-kai text-sm hover:bg-navy-500/8"
          >
            <RotateCcw size={15} />
            恢复默认
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-kai text-sm font-bold transition-all ${
              saved ? "bg-navy-600/60 text-paper" : "btn-navy"
            }`}
          >
            <Save size={15} />
            {saved ? "已保存" : "保存配置"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：编辑区 */}
        <div className="col-span-7 space-y-4">
          {/* 品牌信息 */}
          <section className="ink-card rounded-2xl p-4">
            <h2 className="font-kai text-sm font-bold text-navy-900 mb-3 flex items-center gap-1.5">
              <Type size={16} className="text-navy-600" />
              品牌信息
            </h2>
            <div className="space-y-3">
              <Field label="品牌名（毛笔字标题）">
                <input
                  value={draft.brandName}
                  onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
                />
              </Field>
              <Field label="首页印章文字">
                <input
                  value={draft.heroBadge}
                  onChange={(e) => setDraft({ ...draft, heroBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
                />
              </Field>
            </div>
          </section>

          {/* 轮播图 */}
          <section className="ink-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-kai text-sm font-bold text-navy-900 flex items-center gap-1.5">
                <ImageIcon size={16} className="text-navy-600" />
                首页轮播图
              </h2>
              <button
                onClick={addCarouselItem}
                className="flex items-center gap-1 text-xs text-navy-600 font-kai hover:bg-navy-500/8 px-2 py-1 rounded-lg"
              >
                <Plus size={13} />
                添加
              </button>
            </div>
            <div className="space-y-3">
              {draft.carousel.map((item, i) => (
                <div key={i} className="rounded-xl border border-navy-500/10 p-3 bg-navy-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-navy-800/50 font-kai">第 {i + 1} 张</span>
                    {draft.carousel.length > 1 && (
                      <button
                        onClick={() => removeCarouselItem(i)}
                        className="text-gold-dark hover:bg-gold/10 p-1 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 h-12 rounded-md overflow-hidden flex-shrink-0 bg-navy-100">
                      {item.url && (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={item.title}
                        onChange={(e) => updateCarouselItem(i, { title: e.target.value })}
                        placeholder="标题"
                        className="w-full px-2 py-1.5 rounded-md border border-navy-500/15 bg-paper font-kai text-xs focus:outline-none focus:border-navy-500/50"
                      />
                      <input
                        value={item.url}
                        onChange={(e) => updateCarouselItem(i, { url: e.target.value })}
                        placeholder="图片 URL"
                        className="w-full px-2 py-1.5 rounded-md border border-navy-500/15 bg-paper font-mono text-[10px] focus:outline-none focus:border-navy-500/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 右侧：实时预览 */}
        <div className="col-span-5">
          <div className="ink-card rounded-2xl p-4 sticky top-4">
            <h2 className="font-kai text-sm font-bold text-navy-900 mb-3 flex items-center gap-1.5">
              <Eye size={16} className="text-navy-600" />
              实时预览
              <span className="ml-auto text-[10px] text-navy-800/50 flex items-center gap-1">
                <Smartphone size={11} />
                客户端首页
              </span>
            </h2>

            {/* 手机外壳 */}
            <div
              className="mx-auto rounded-[28px] border-[6px] border-navy-900 overflow-hidden shadow-xl"
              style={{ width: 260, height: 460, background: "#FFFFFF" }}
            >
              <div className="h-full overflow-y-auto">
                {/* 板块一：毛笔字标题（与客户端首页一致） */}
              <header className="px-4 pt-4 pb-2 flex items-center justify-between">
                <BrushTitle size="sm" text={draft.brandName} seal={draft.heroBadge} />
                <span className="text-[9px] text-navy-800/50 font-kai">七上</span>
              </header>

              {/* 板块二：横屏轮播图（多张 + 圆点导航） */}
              <section className="px-3 mb-3">
                <div
                  className="relative w-full rounded-xl overflow-hidden shadow-sm"
                  style={{ aspectRatio: "16/9", background: `${NAVY_500}20` }}
                >
                  {draft.carousel[0]?.url && (
                    <img src={draft.carousel[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-2"
                    style={{ background: `linear-gradient(to top, ${NAVY_500}cc, transparent)` }}
                  >
                    <p className="text-white text-[9px] font-kai truncate">
                      {draft.carousel[0]?.title || "轮播图标题"}
                    </p>
                  </div>
                  {draft.carousel.length > 1 && (
                    <div className="absolute bottom-1.5 right-2 flex gap-1">
                      {draft.carousel.map((_, i) => (
                        <span
                          key={i}
                          className="rounded-full transition-all"
                          style={{
                            width: i === 0 ? 8 : 4,
                            height: 4,
                            background: i === 0 ? "#fff" : "rgba(255,255,255,0.5)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 板块三：折叠式学段选择器 + 学习概况三栏 */}
              <section className="px-3 mb-3 space-y-2">
                <div className="ink-card rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-0.5 h-4 rounded-full" style={{ background: NAVY_600 }} />
                      <div className="text-left">
                        <p className="font-kai text-[11px] font-bold text-navy-900 leading-none">
                          当前学段 · 七上
                        </p>
                        <p className="text-[8px] text-navy-800/50 mt-0.5 font-kai">七年级上册</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-navy-800/50">
                      <span className="text-[8px] font-kai">切换年级</span>
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>
                <div className="ink-card rounded-2xl p-2 grid grid-cols-3 gap-1">
                  <div className="flex flex-col items-center">
                    <Flame size={13} style={{ color: NAVY_500 }} className="mb-0.5" />
                    <span className="font-bold text-sm text-navy-900 leading-none">12</span>
                    <span className="text-[7px] text-navy-800/50 mt-0.5">坚持天数</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-navy-500/10">
                    <Target size={13} style={{ color: NAVY_500 }} className="mb-0.5" />
                    <span className="font-bold text-sm text-navy-900 leading-none">8</span>
                    <span className="text-[7px] text-navy-800/50 mt-0.5">今日答题</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <TrendingUp size={13} style={{ color: NAVY_600 }} className="mb-0.5" />
                    <span className="font-bold text-sm text-navy-900 leading-none">
                      85<span className="text-[8px]">%</span>
                    </span>
                    <span className="text-[7px] text-navy-800/50 mt-0.5">正确率</span>
                  </div>
                </div>
              </section>

              {/* 板块四：学科入口（两列网格，与客户端一致） */}
              <section className="px-3 pb-3">
                <h2 className="font-kai text-[11px] font-bold text-navy-900 mb-2 flex items-center gap-1">
                  <span className="w-0.5 h-3 rounded-full" style={{ background: NAVY_500 }} />
                  学科学习
                </h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.values(SUBJECTS).map((s) => {
                    const tb = getTextbooksByGrade("七年级上册").find((t) => t.subject === s.key);
                    return (
                      <div
                        key={s.key}
                        className="ink-card rounded-xl overflow-hidden"
                        style={{ borderTop: `2px solid ${s.color}` }}
                      >
                        <div
                          className="relative px-2 pt-2 pb-1.5 overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${s.bgColor} 0%, rgba(255,255,255,0) 100%)` }}
                        >
                          <span className="absolute -right-1 -top-0.5 text-2xl opacity-15 select-none pointer-events-none">
                            {s.icon}
                          </span>
                          <div className="relative flex items-start justify-between mb-1">
                            <div>
                              <p className="font-kai text-[11px] font-bold leading-none" style={{ color: s.color }}>
                                {s.name}
                              </p>
                              <p className="text-[7px] text-navy-800/50 mt-0.5 font-kai">
                                今日 <span className="font-bold text-[10px]" style={{ color: s.color }}>0</span> 题
                              </p>
                            </div>
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                              style={{ background: "rgba(255,255,255,0.7)" }}
                            >
                              {s.icon}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              className="flex-1 h-0.5 rounded-full overflow-hidden"
                              style={{ background: `${s.color}20` }}
                            >
                              <div className="h-full rounded-full" style={{ width: "0%", background: s.color }} />
                            </div>
                            <span className="text-[7px] font-kai flex-shrink-0" style={{ color: s.color }}>
                              未练
                            </span>
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <div
                            className="rounded-lg py-1 text-center text-[8px] font-kai font-bold text-white flex items-center justify-center gap-0.5"
                            style={{ background: s.color }}
                          >
                            去学习 <ChevronRight size={9} />
                          </div>
                        </div>
                        <div
                          className="flex items-center justify-between px-2 py-1 border-t border-navy-500/8"
                          style={{ background: `${s.color}08` }}
                        >
                          <div className="flex items-center gap-0.5 min-w-0">
                            <BookOpen size={8} style={{ color: s.color }} className="flex-shrink-0" />
                            <span
                              className="text-[7px] font-kai font-bold px-1 py-0 rounded truncate"
                              style={{ background: s.bgColor, color: s.color }}
                            >
                              {tb?.versions[0] || "人教版"}
                            </span>
                          </div>
                          <ChevronDown size={9} style={{ color: s.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              </div>
            </div>

            <button
              onClick={() => navigate("/app/home")}
              className="w-full mt-3 py-2 rounded-lg border border-navy-500/15 text-navy-900 font-kai text-xs hover:bg-navy-500/8"
            >
              在新页面打开客户端 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-kai text-navy-800/60 mb-1">{label}</label>
      {children}
    </div>
  );
}
