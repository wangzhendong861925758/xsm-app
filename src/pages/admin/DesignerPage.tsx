import { useState, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Flame,
  Target,
  TrendingUp,
  Check,
  X,
  Download,
  Upload,
  RotateCcw,
  ImagePlus,
  Eye,
  Layers,
  Save,
} from "lucide-react";
import { GRADES, getTextbooksByGrade, SUBJECTS } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import { DEFAULT_HOME_DESIGN, type HomeDesignConfig } from "@/data/homeDesign";
import type { Subject } from "@/data/types";

// 默认配置从共享文件导入
const DEFAULT_CONFIG = DEFAULT_HOME_DESIGN;

type Config = HomeDesignConfig;

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-[11px] text-gray-400 w-20 flex-shrink-0 truncate">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer border border-gray-600 flex-shrink-0"
        style={{ background: value }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-800 text-white text-[11px] px-2 py-1 rounded border border-gray-700 font-mono"
      />
    </div>
  );
}

function NumInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-[11px] text-gray-400 w-20 flex-shrink-0 truncate">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-16 bg-gray-800 text-white text-[11px] px-2 py-1 rounded border border-gray-700 font-mono"
      />
      {suffix && <span className="text-[10px] text-gray-500">{suffix}</span>}
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-[11px] text-gray-400 w-20 flex-shrink-0 truncate">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-800 text-white text-[11px] px-2 py-1 rounded border border-gray-700"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-700">
      <button onClick={() => setOpen(!open)} className="w-full px-3 py-2 flex items-center justify-between text-left">
        <span className="text-[12px] font-bold text-orange-400">{title}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export default function DesignerPage() {
  const { homeDesign: storedConfig, updateHomeDesign, resetHomeDesign } = useStore();
  const [config, setConfig] = useState<Config>(storedConfig);
  const [selectedGrade, setGrade] = useState("八年级下册");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");
  const [refImage, setRefImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [showRef, setShowRef] = useState(true);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);

  const SLIDES = ["/images/slide1.jpg", "/images/slide2.jpg", "/images/slide3.jpg"];
  const textbooks = getTextbooksByGrade(selectedGrade);

  const update = (path: string, value: any) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const exportConfig = () => {
    const data = JSON.stringify(config, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `home-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        setConfig({ ...DEFAULT_CONFIG, ...imported });
      } catch {
        alert("JSON 格式错误");
      }
    };
    reader.readAsText(file);
  };

  const saveToStore = () => {
    updateHomeDesign(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    resetHomeDesign();
  };

  const uploadRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRefImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* 左侧：实时预览 */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-6 bg-gray-950">
        <div className="mb-3 flex gap-2 flex-wrap justify-center">
          <button onClick={saveToStore} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${saved ? "bg-green-500" : "bg-red-600 hover:bg-red-700"}`}>
            <Save size={16} /> {saved ? "已保存!" : "保存并应用"}
          </button>
          <button onClick={() => exportConfig()} className="px-4 py-2 bg-green-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700">
            <Download size={16} /> 导出
          </button>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
            <Upload size={16} /> 导入
          </button>
          <button onClick={handleReset} className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-600">
            <RotateCcw size={16} /> 重置
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importConfig} />
          <button onClick={() => refFileRef.current?.click()} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${refImage ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-700 hover:bg-gray-600"}`}>
            <ImagePlus size={16} /> {refImage ? "参考图已加载" : "上传参考图"}
          </button>
          <input ref={refFileRef} type="file" accept="image/*" className="hidden" onChange={uploadRefImage} />
          <button
            onClick={() => setActiveTab(activeTab === "preview" ? "json" : "preview")}
            className="px-4 py-2 bg-orange-600 rounded-lg text-sm font-bold"
          >
            {activeTab === "preview" ? "查看 JSON" : "查看预览"}
          </button>
        </div>

        {/* 对比控制栏 */}
        {refImage && activeTab === "preview" && (
          <div className="mb-3 flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
            <button
              onClick={() => setShowRef(!showRef)}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ${showRef ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400"}`}
            >
              <Layers size={14} /> 参考图
            </button>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] text-gray-400">参考图</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-[10px] text-gray-400">预览</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{Math.round(overlayOpacity * 100)}%</span>
            {refImage && (
              <button onClick={() => { setRefImage(null); setShowRef(true); }} className="text-[10px] text-red-400 hover:text-red-300">
                移除
              </button>
            )}
          </div>
        )}

        {activeTab === "json" ? (
          <pre className="text-[11px] text-green-300 font-mono p-4 max-w-2xl overflow-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        ) : (
          /* 预览区 — 复刻 HomePage 渲染 */
          <div className="w-[375px] min-h-[812px] relative" style={{ background: config.pageBg, borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            {/* 参考图叠加层 */}
            {showRef && refImage && (
              <img src={refImage} alt="参考图" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 1 - overlayOpacity, zIndex: 0, pointerEvents: "none" }} />
            )}
            {/* 实时预览层 */}
            <div style={{ position: "relative", zIndex: 1, opacity: overlayOpacity }}>
            {/* 顶部蓝色渐变区域 */}
            <div className="relative" style={{ background: `linear-gradient(180deg, ${config.topGradientFrom} 0%, ${config.topGradientMid} 50%, ${config.topGradientTo} 100%)`, paddingBottom: config.topPaddingBottom }}>
              <div style={{ paddingLeft: config.brandPaddingX, paddingRight: config.brandPaddingX, paddingTop: config.brandPaddingTop }}>
                <img src="/images/ac.png" alt="品牌" style={{ height: config.brandHeight, width: "auto", objectFit: "contain" }} />
              </div>
              <div style={{ marginLeft: config.carouselMarginX, marginRight: config.carouselMarginX, marginTop: config.carouselMarginTop, borderRadius: config.carouselRadius, overflow: "hidden", position: "relative", aspectRatio: config.carouselAspect, background: "#1a1a3e" }}>
                {SLIDES.map((src, i) => (
                  <div key={src} style={{ position: "absolute", inset: 0, opacity: i === bannerIndex ? 1 : 0, transition: "opacity 0.7s" }}>
                    <img src={src} alt={`轮播${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
                <div style={{ position: "absolute", bottom: 8, right: 12, display: "flex", gap: 6, zIndex: 10 }}>
                  {SLIDES.map((_, i) => (
                    <span key={i} onClick={() => setBannerIndex(i)} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: i === bannerIndex ? "#fff" : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                    }} />
                  ))}
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div style={{ position: "relative", zIndex: 10, paddingLeft: config.contentPaddingX, paddingRight: config.contentPaddingX, marginTop: config.contentMarginTop, paddingBottom: config.contentPaddingBottom }}>
              {/* 所学年级 + 统计卡片 */}
              <div style={{ background: config.cardBg, borderRadius: config.cardRadius, overflow: "hidden", boxShadow: config.cardShadow }}>
                {/* 所学年级标题栏 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
                    <img src={config.gradeIconSrc} alt="图标" style={{ height: config.gradeIconSize, width: config.gradeIconSize, objectFit: "contain" }} />
                    <span style={{ fontSize: config.gradeTitleSize, fontWeight: 700, color: config.gradeTitleColor }}>{config.gradeTitleText}</span>
                  </div>
                  <div style={{
                    background: `linear-gradient(90deg, ${config.gradeBtnFrom}, ${config.gradeBtnTo})`,
                    borderBottomLeftRadius: config.gradeBtnRadius,
                    padding: `${config.gradeBtnPaddingY}px ${config.gradeBtnPaddingX}px`,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: config.gradeBtnTextSize, fontWeight: 700, color: "#fff" }}>{selectedGrade}</span>
                    <ChevronDown size={18} color="#fff" />
                  </div>
                </div>

                {/* 统计卡片 */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: config.statGridGap,
                  padding: `4px ${config.statGridPaddingX}px ${config.statGridPaddingBottom}px`,
                }}>
                  {[
                    { value: 7, unit: "天", label: "坚持学习", icon: <Flame size={16} className="text-orange-400" /> },
                    { value: 23, unit: "题", label: "今日答题", icon: <Target size={16} className="text-blue-400" /> },
                    { value: 85, unit: "%", label: "正确率", icon: <TrendingUp size={16} className="text-green-400" /> },
                  ].map((s, i) => (
                    <div key={i} style={{
                      borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      padding: "12px 4px",
                      background: `linear-gradient(180deg, ${config.statBgFrom}, ${config.statBgTo})`,
                      borderBottom: `3px solid ${config.statBorderColor}`,
                      borderRight: `2px solid ${config.statBorderColor}30`,
                      borderBottomRightRadius: 16,
                    }}>
                      <div style={{ marginBottom: 2 }}>{s.icon}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                        <span style={{ fontSize: config.statNumberSize, fontWeight: 900, color: config.statNumberColor, fontStyle: "italic", lineHeight: 1 }}>{s.value}</span>
                        <span style={{ fontSize: config.statUnitSize, fontWeight: 700, color: config.statUnitColor }}>{s.unit}</span>
                      </div>
                      <span style={{ fontSize: config.statLabelSize, color: config.statLabelColor, marginTop: 4 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 学科卡片网格 */}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: config.subjectCardGap }}>
                {textbooks.map((tb) => {
                  const sub = config.subjects[tb.subject as keyof typeof config.subjects] || { color: "#888", name: tb.subject, icon: "" };
                  return (
                    <div key={tb.subject} style={{
                      borderRadius: config.subjectCardRadius, padding: config.subjectCardPadding,
                      position: "relative", overflow: "hidden",
                      background: `linear-gradient(135deg, ${sub.color}10, ${sub.color}05)`,
                    }}>
                      {/* 图标+名称 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{
                          width: config.subjectIconSize, height: config.subjectIconSize,
                          borderRadius: config.subjectIconRadius,
                          background: sub.color,
                          boxShadow: `0 3px 8px ${sub.color}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, overflow: "hidden",
                        }}>
                          {sub.icon && <img src={sub.icon} alt={sub.name} style={{ width: config.subjectIconImgSize, height: config.subjectIconImgSize, objectFit: "contain" }} />}
                        </div>
                        <span style={{ fontSize: config.subjectNameSize, fontWeight: 900, color: config.subjectNameColor, lineHeight: 1 }}>{sub.name}</span>
                      </div>

                      {/* 已学习 */}
                      <p style={{ fontSize: config.subjectLearnedSize, color: config.subjectLearnedColor, marginBottom: 4 }}>
                        已学习 <span style={{ fontSize: config.subjectLearnedNumSize, fontWeight: 700, color: config.subjectLearnedNumColor }}>0</span> 道题
                      </p>

                      {/* 进度条 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, height: config.subjectProgressHeight, borderRadius: config.subjectProgressRadius, overflow: "hidden", background: `${sub.color}20` }}>
                          <div style={{ height: "100%", borderRadius: 999, width: "0%", background: `linear-gradient(90deg, ${sub.color}CC, ${sub.color})` }} />
                        </div>
                        <span style={{ fontSize: config.subjectRateSize, color: config.subjectRateColor, flexShrink: 0 }}>0%</span>
                      </div>
                      <p style={{ fontSize: 10, color: "#9CA3AF", textAlign: "right", marginTop: -4, marginBottom: 8 }}>正确率</p>

                      {/* 去学习 */}
                      <div style={{ width: "100%", padding: "6px 0", borderRadius: 999, fontSize: config.subjectBtnSize, fontWeight: 700, color: config.subjectBtnColor, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        去学习 <ChevronRight size={16} style={{ color: config.subjectBtnColor }} />
                      </div>

                      {/* 版本 */}
                      <div style={{ textAlign: "center", fontSize: config.subjectVersionSize, color: config.subjectVersionColor, paddingTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        人教版
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>{/* 关闭实时预览层 */}
          </div>
        )}
      </div>

      {/* 右侧：控制面板 */}
      <div className="w-[340px] bg-gray-900 border-l border-gray-700 overflow-y-auto flex-shrink-0">
        <div className="px-3 py-3 bg-gray-800 border-b border-gray-700">
          <h1 className="text-sm font-bold text-orange-400">超级设计器</h1>
          <p className="text-[10px] text-gray-500 mt-1">实时编辑首页所有属性，导出 JSON 后交给 AI 应用</p>
        </div>

        <Section title="页面背景">
          <ColorInput label="页面背景色" value={config.pageBg} onChange={(v) => update("pageBg", v)} />
        </Section>

        <Section title="顶部蓝色区域">
          <ColorInput label="渐变起始" value={config.topGradientFrom} onChange={(v) => update("topGradientFrom", v)} />
          <ColorInput label="渐变中间" value={config.topGradientMid} onChange={(v) => update("topGradientMid", v)} />
          <ColorInput label="渐变结束" value={config.topGradientTo} onChange={(v) => update("topGradientTo", v)} />
          <NumInput label="底部内边距" value={config.topPaddingBottom} onChange={(v) => update("topPaddingBottom", v)} suffix="px" />
        </Section>

        <Section title="品牌图 (ac.png)">
          <NumInput label="高度" value={config.brandHeight} onChange={(v) => update("brandHeight", v)} suffix="px" />
          <NumInput label="左右边距" value={config.brandPaddingX} onChange={(v) => update("brandPaddingX", v)} suffix="px" />
          <NumInput label="顶部边距" value={config.brandPaddingTop} onChange={(v) => update("brandPaddingTop", v)} suffix="px" />
        </Section>

        <Section title="轮播图">
          <NumInput label="左右边距" value={config.carouselMarginX} onChange={(v) => update("carouselMarginX", v)} suffix="px" />
          <NumInput label="顶部边距" value={config.carouselMarginTop} onChange={(v) => update("carouselMarginTop", v)} suffix="px" />
          <NumInput label="圆角" value={config.carouselRadius} onChange={(v) => update("carouselRadius", v)} suffix="px" />
          <TextInput label="宽高比" value={config.carouselAspect} onChange={(v) => update("carouselAspect", v)} />
        </Section>

        <Section title="内容容器">
          <NumInput label="上偏移" value={config.contentMarginTop} onChange={(v) => update("contentMarginTop", v)} suffix="px" />
          <NumInput label="左右边距" value={config.contentPaddingX} onChange={(v) => update("contentPaddingX", v)} suffix="px" />
          <NumInput label="底部留白" value={config.contentPaddingBottom} onChange={(v) => update("contentPaddingBottom", v)} suffix="px" />
        </Section>

        <Section title="白色卡片容器">
          <ColorInput label="背景色" value={config.cardBg} onChange={(v) => update("cardBg", v)} />
          <NumInput label="圆角" value={config.cardRadius} onChange={(v) => update("cardRadius", v)} suffix="px" />
        </Section>

        <Section title="所学年级标题栏">
          <TextInput label="图标路径" value={config.gradeIconSrc} onChange={(v) => update("gradeIconSrc", v)} />
          <NumInput label="图标尺寸" value={config.gradeIconSize} onChange={(v) => update("gradeIconSize", v)} suffix="px" />
          <TextInput label="标题文字" value={config.gradeTitleText} onChange={(v) => update("gradeTitleText", v)} />
          <NumInput label="标题字号" value={config.gradeTitleSize} onChange={(v) => update("gradeTitleSize", v)} suffix="px" />
          <ColorInput label="标题颜色" value={config.gradeTitleColor} onChange={(v) => update("gradeTitleColor", v)} />
          <ColorInput label="按钮渐变起" value={config.gradeBtnFrom} onChange={(v) => update("gradeBtnFrom", v)} />
          <ColorInput label="按钮渐变止" value={config.gradeBtnTo} onChange={(v) => update("gradeBtnTo", v)} />
          <NumInput label="按钮圆角" value={config.gradeBtnRadius} onChange={(v) => update("gradeBtnRadius", v)} suffix="px" />
          <NumInput label="按钮字号" value={config.gradeBtnTextSize} onChange={(v) => update("gradeBtnTextSize", v)} suffix="px" />
        </Section>

        <Section title="统计卡片">
          <ColorInput label="边框色" value={config.statBorderColor} onChange={(v) => update("statBorderColor", v)} />
          <ColorInput label="背景渐变起" value={config.statBgFrom} onChange={(v) => update("statBgFrom", v)} />
          <ColorInput label="背景渐变止" value={config.statBgTo} onChange={(v) => update("statBgTo", v)} />
          <NumInput label="数字字号" value={config.statNumberSize} onChange={(v) => update("statNumberSize", v)} suffix="px" />
          <ColorInput label="数字颜色" value={config.statNumberColor} onChange={(v) => update("statNumberColor", v)} />
          <NumInput label="单位字号" value={config.statUnitSize} onChange={(v) => update("statUnitSize", v)} suffix="px" />
          <ColorInput label="单位颜色" value={config.statUnitColor} onChange={(v) => update("statUnitColor", v)} />
          <NumInput label="标签字号" value={config.statLabelSize} onChange={(v) => update("statLabelSize", v)} suffix="px" />
          <ColorInput label="标签颜色" value={config.statLabelColor} onChange={(v) => update("statLabelColor", v)} />
        </Section>

        <Section title="学科卡片通用">
          <NumInput label="卡片间距" value={config.subjectCardGap} onChange={(v) => update("subjectCardGap", v)} suffix="px" />
          <NumInput label="卡片内边距" value={config.subjectCardPadding} onChange={(v) => update("subjectCardPadding", v)} suffix="px" />
          <NumInput label="卡片圆角" value={config.subjectCardRadius} onChange={(v) => update("subjectCardRadius", v)} suffix="px" />
          <NumInput label="图标框尺寸" value={config.subjectIconSize} onChange={(v) => update("subjectIconSize", v)} suffix="px" />
          <NumInput label="图标框圆角" value={config.subjectIconRadius} onChange={(v) => update("subjectIconRadius", v)} suffix="px" />
          <NumInput label="图标图片尺寸" value={config.subjectIconImgSize} onChange={(v) => update("subjectIconImgSize", v)} suffix="px" />
          <NumInput label="学科名字号" value={config.subjectNameSize} onChange={(v) => update("subjectNameSize", v)} suffix="px" />
          <ColorInput label="学科名颜色" value={config.subjectNameColor} onChange={(v) => update("subjectNameColor", v)} />
          <NumInput label="已学习字号" value={config.subjectLearnedSize} onChange={(v) => update("subjectLearnedSize", v)} suffix="px" />
          <ColorInput label="已学习颜色" value={config.subjectLearnedColor} onChange={(v) => update("subjectLearnedColor", v)} />
          <NumInput label="数字字号" value={config.subjectLearnedNumSize} onChange={(v) => update("subjectLearnedNumSize", v)} suffix="px" />
          <ColorInput label="数字颜色" value={config.subjectLearnedNumColor} onChange={(v) => update("subjectLearnedNumColor", v)} />
          <NumInput label="进度条高度" value={config.subjectProgressHeight} onChange={(v) => update("subjectProgressHeight", v)} suffix="px" />
          <NumInput label="百分比字号" value={config.subjectRateSize} onChange={(v) => update("subjectRateSize", v)} suffix="px" />
          <ColorInput label="按钮颜色" value={config.subjectBtnColor} onChange={(v) => update("subjectBtnColor", v)} />
          <NumInput label="按钮字号" value={config.subjectBtnSize} onChange={(v) => update("subjectBtnSize", v)} suffix="px" />
        </Section>

        {/* 各学科单独配置 */}
        {Object.entries(config.subjects).map(([key, sub]) => (
          <Section key={key} title={`学科: ${sub.name}`}>
            <TextInput label="名称" value={sub.name} onChange={(v) => update(`subjects.${key}.name`, v)} />
            <ColorInput label="主题色" value={sub.color} onChange={(v) => update(`subjects.${key}.color`, v)} />
            <TextInput label="图标路径" value={sub.icon} onChange={(v) => update(`subjects.${key}.icon`, v)} />
          </Section>
        ))}
      </div>
    </div>
  );
}
