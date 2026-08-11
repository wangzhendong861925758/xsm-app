import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Palette, Type, Image as ImageIcon, Eye, RotateCcw, Plus, Trash2, Save, Smartphone,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { CarouselItem } from "@/store/useStore";
import { SUBJECTS, GRADES } from "@/data/textbooks";

const PRESET_THEMES = [
  { name: "天蓝明亮", primary: "#0EA5E9", accent: "#0284C7", bg: "#FFFFFF" },
  { name: "海蓝深邃", primary: "#0369A1", accent: "#075985", bg: "#F0F9FF" },
  { name: "浅蓝清爽", primary: "#38BDF8", accent: "#0EA5E9", bg: "#F8FAFC" },
  { name: "蓝白简约", primary: "#0284C7", accent: "#0369A1", bg: "#FFFFFF" },
  { name: "深蓝稳重", primary: "#0C4A6E", accent: "#075985", bg: "#F1F5F9" },
];

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
          <p className="font-kai text-xs text-navy-800/60">编辑站点外观与内容，保存后实时生效</p>
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
          {/* 预设主题 */}
          <section className="ink-card rounded-2xl p-4">
            <h2 className="font-kai text-sm font-bold text-navy-900 mb-3 flex items-center gap-1.5">
              <Palette size={16} className="text-navy-600" />
              预设主题
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_THEMES.map((t) => {
                const active = draft.primaryColor === t.primary;
                return (
                  <button
                    key={t.name}
                    onClick={() => setDraft({ ...draft, primaryColor: t.primary, accentColor: t.accent, bgBase: t.bg })}
                    className={`p-2 rounded-xl border-2 transition-all text-center ${
                      active ? "border-navy-600 bg-navy-500/8" : "border-navy-500/10 hover:border-navy-500/30"
                    }`}
                  >
                    <div className="flex gap-1 justify-center mb-1.5">
                      <span className="w-5 h-5 rounded-full" style={{ background: t.primary }} />
                      <span className="w-5 h-5 rounded-full" style={{ background: t.accent }} />
                    </div>
                    <span className="text-[10px] font-kai text-navy-900">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

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
              <Field label="副标题">
                <input
                  value={draft.brandSub}
                  onChange={(e) => setDraft({ ...draft, brandSub: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
                />
              </Field>
              <Field label="首页右上角小标签">
                <input
                  value={draft.heroBadge}
                  onChange={(e) => setDraft({ ...draft, heroBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
                />
              </Field>
            </div>
          </section>

          {/* 主题色 */}
          <section className="ink-card rounded-2xl p-4">
            <h2 className="font-kai text-sm font-bold text-navy-900 mb-3 flex items-center gap-1.5">
              <Palette size={16} className="text-navy-600" />
              主题色
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <ColorField
                label="主色"
                value={draft.primaryColor}
                onChange={(v) => setDraft({ ...draft, primaryColor: v })}
              />
              <ColorField
                label="强调色"
                value={draft.accentColor}
                onChange={(v) => setDraft({ ...draft, accentColor: v })}
              />
              <ColorField
                label="背景基色"
                value={draft.bgBase}
                onChange={(v) => setDraft({ ...draft, bgBase: v })}
              />
            </div>
            <p className="text-[10px] text-navy-800/50 mt-2 font-kai">
              提示：主题色影响客户端按钮、进度条、选中态等关键交互元素
            </p>
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
              style={{ width: 260, height: 460, background: draft.bgBase }}
            >
              <div className="h-full overflow-y-auto">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div>
                    <p
                      className="font-bold leading-none"
                      style={{
                        fontFamily: '"Ma Shan Zheng", "Noto Serif SC", serif',
                        fontSize: 22,
                        color: draft.primaryColor,
                      }}
                    >
                      {draft.brandName}
                    </p>
                    <p className="text-[8px] mt-0.5 font-kai" style={{ color: draft.primaryColor, opacity: 0.6 }}>
                      {draft.brandSub}
                    </p>
                  </div>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full font-kai"
                    style={{ background: `${draft.primaryColor}15`, color: draft.primaryColor }}
                  >
                    {draft.heroBadge}
                  </span>
                </div>

                {/* 轮播图 */}
                <div className="px-3 mb-3">
                  <div
                    className="relative w-full rounded-xl overflow-hidden"
                    style={{ aspectRatio: "16/9", background: `${draft.primaryColor}20` }}
                  >
                    {draft.carousel[0]?.url && (
                      <img
                        src={draft.carousel[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div
                      className="absolute bottom-0 left-0 right-0 p-2"
                      style={{
                        background: `linear-gradient(to top, ${draft.primaryColor}cc, transparent)`,
                      }}
                    >
                      <p className="text-white text-[9px] font-kai truncate">
                        {draft.carousel[0]?.title || "轮播图标题"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 学科卡片预览 */}
                <div className="px-3 mb-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.values(SUBJECTS).slice(0, 4).map((s) => (
                      <div
                        key={s.key}
                        className="aspect-square rounded-lg flex flex-col items-center justify-center"
                        style={{ background: `${draft.primaryColor}10` }}
                      >
                        <span className="text-base">{s.icon}</span>
                        <span
                          className="text-[8px] font-kai mt-0.5"
                          style={{ color: draft.primaryColor }}
                        >
                          {s.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 年级滑动条 */}
                <div className="px-3 mb-3">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {GRADES.slice(0, 4).map((g, i) => (
                      <span
                        key={g.key}
                        className="flex-shrink-0 px-2 py-1 rounded-full text-[8px] font-kai whitespace-nowrap"
                        style={
                          i === 0
                            ? { background: draft.primaryColor, color: "#fff" }
                            : { background: "#fff", color: draft.primaryColor, border: `1px solid ${draft.primaryColor}30` }
                        }
                      >
                        {g.short}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 数据三栏 */}
                <div className="px-3 mb-3">
                  <div
                    className="rounded-xl p-2 grid grid-cols-3 gap-1"
                    style={{ background: "#fff", border: `1px solid ${draft.primaryColor}15` }}
                  >
                    {[
                      { label: "坚持", val: 12 },
                      { label: "今日", val: 8 },
                      { label: "正确率", val: 85 },
                    ].map((it, idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-[10px] font-bold" style={{ color: draft.primaryColor }}>
                          {it.val}
                          {it.label === "正确率" && "%"}
                        </p>
                        <p className="text-[7px] font-kai text-navy-800/50">{it.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 模拟按钮 */}
                <div className="px-3 mb-3 space-y-1.5">
                  <div
                    className="rounded-lg py-1.5 text-center text-[9px] font-kai font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${draft.primaryColor}, ${draft.primaryColor}dd)` }}
                  >
                    全真模拟考试
                  </div>
                  <div
                    className="rounded-lg py-1.5 text-center text-[9px] font-kai font-bold"
                    style={{ background: `${draft.accentColor}20`, color: draft.accentColor }}
                  >
                    真题考试
                  </div>
                </div>
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-kai text-navy-800/60 mb-1">{label}</label>
      <div className="flex items-center gap-1.5 rounded-lg border border-navy-500/15 bg-paper p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs bg-transparent focus:outline-none text-navy-900"
        />
      </div>
    </div>
  );
}
