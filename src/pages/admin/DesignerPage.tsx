import { useState, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Flame,
  Target,
  TrendingUp,
  Download,
  Upload,
  RotateCcw,
  ImagePlus,
  Layers,
  Save,
  Type,
  Palette,
  Square,
  Move,
} from "lucide-react";
import { getTextbooksByGrade } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import { DEFAULT_HOME_DESIGN, type HomeDesignConfig } from "@/data/homeDesign";

type Config = HomeDesignConfig;

// 元素类型
type ElementKey =
  | "page" | "topBar" | "brand" | "carousel"
  | "gradeBar" | "gradeBtn"
  | "stats" | "stat1" | "stat2" | "stat3"
  | "subjectCard" | "subject-0" | "subject-1" | "subject-2" | "subject-3" | "subject-4" | "subject-5";

const ELEMENTS: { key: ElementKey; label: string; icon: any }[] = [
  { key: "page", label: "页面背景", icon: Square },
  { key: "topBar", label: "顶部蓝条", icon: Square },
  { key: "brand", label: "品牌图标", icon: ImagePlus },
  { key: "carousel", label: "轮播图", icon: Layers },
  { key: "gradeBar", label: "所学年级栏", icon: Move },
  { key: "gradeBtn", label: "年级按钮", icon: Square },
  { key: "stats", label: "统计卡片", icon: Square },
  { key: "subjectCard", label: "学科卡片", icon: Square },
  { key: "subject-0", label: "物理", icon: Square },
  { key: "subject-1", label: "化学", icon: Square },
  { key: "subject-2", label: "生物", icon: Square },
  { key: "subject-3", label: "道法", icon: Square },
  { key: "subject-4", label: "历史", icon: Square },
  { key: "subject-5", label: "地理", icon: Square },
];

const SUBJECT_KEYS = ["physics", "chemistry", "biology", "politics", "history", "geography"];

// 滑块组件
function Slider({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-300">{label}</span>
        <span className="text-[11px] text-blue-400 font-mono">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-blue-500 h-1.5" />
    </div>
  );
}

// 色板组件
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-300">{label}</span>
        <span className="text-[10px] text-gray-500 font-mono">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 rounded-lg cursor-pointer border-2 border-gray-600" />
        <div className="flex gap-1 flex-wrap">
          {["#3B76F7", "#3559E8", "#2D4CE3", "#2266FF", "#3388FF", "#E83E3E", "#22C593", "#EC4899", "#7C3AED", "#F59E0B", "#22C55E", "#FFFFFF", "#1F2937", "#6B7280", "#F0F4FF", "#88CCFF"].map(c => (
            <button key={c} onClick={() => onChange(c)}
              className={`w-5 h-5 rounded border ${value.toUpperCase() === c.toUpperCase() ? "border-blue-400 border-2" : "border-gray-600"}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 文字输入
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="py-2">
      <span className="text-[11px] text-gray-300 block mb-1">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none" />
    </div>
  );
}

// 图片路径输入
function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="py-2">
      <span className="text-[11px] text-gray-300 block mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <img src={value} alt="" className="w-8 h-8 rounded border border-gray-600 object-cover bg-gray-800 flex-shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none min-w-0" />
      </div>
    </div>
  );
}

function Group({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-800">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-gray-800/50">
        <Icon size={14} className="text-blue-400" />
        <span className="text-[12px] font-bold text-gray-200 flex-1">{title}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function DesignerPage() {
  const { homeDesign, updateHomeDesign, resetHomeDesign } = useStore();
  const [config, setConfig] = useState<Config>(homeDesign);
  const [selected, setSelected] = useState<ElementKey | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [showRef, setShowRef] = useState(true);
  const [saved, setSaved] = useState(false);
  const refFileRef = useRef<HTMLInputElement>(null);

  const SLIDES = ["/images/slide1.jpg", "/images/slide2.jpg", "/images/slide3.jpg"];
  const textbooks = getTextbooksByGrade("八年级下册");
  const c = config;

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

  const save = () => {
    updateHomeDesign(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadRef = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRefImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // 高亮选中的元素
  const highlight = selected === null ? null : (() => {
    const map: Record<string, string> = {
      page: "0", topBar: "1", brand: "2", carousel: "3",
      gradeBar: "4", gradeBtn: "5", stats: "6",
      subjectCard: "7", "subject-0": "7", "subject-1": "7", "subject-2": "7", "subject-3": "7", "subject-4": "7", "subject-5": "7",
    };
    return map[selected] || null;
  })();

  // 渲染属性面板
  const renderPanel = () => {
    if (!selected) return <p className="text-center text-gray-500 text-xs py-8">点击下方元素或预览图中的区块来编辑</p>;

    if (selected === "page") return (
      <Group title="页面背景" icon={Palette}>
        <ColorPicker label="背景色" value={c.pageBg} onChange={(v) => update("pageBg", v)} />
      </Group>
    );

    if (selected === "topBar") return (
      <Group title="顶部蓝条" icon={Palette}>
        <ColorPicker label="渐变起始色" value={c.topGradientFrom} onChange={(v) => update("topGradientFrom", v)} />
        <ColorPicker label="渐变中间色" value={c.topGradientMid} onChange={(v) => update("topGradientMid", v)} />
        <ColorPicker label="渐变结束色" value={c.topGradientTo} onChange={(v) => update("topGradientTo", v)} />
        <Slider label="底部留白" value={c.topPaddingBottom} min={0} max={40} step={1} onChange={(v) => update("topPaddingBottom", v)} suffix="px" />
      </Group>
    );

    if (selected === "brand") return (
      <Group title="品牌图标" icon={ImagePlus}>
        <ImageField label="图片路径" value="/images/ac.png" onChange={() => {}} />
        <Slider label="图标高度" value={c.brandHeight} min={32} max={120} step={2} onChange={(v) => update("brandHeight", v)} suffix="px" />
        <Slider label="左右边距" value={c.brandPaddingX} min={0} max={40} step={1} onChange={(v) => update("brandPaddingX", v)} suffix="px" />
        <Slider label="顶部边距" value={c.brandPaddingTop} min={0} max={40} step={1} onChange={(v) => update("brandPaddingTop", v)} suffix="px" />
      </Group>
    );

    if (selected === "carousel") return (
      <Group title="轮播图" icon={Layers}>
        <Slider label="左右边距" value={c.carouselMarginX} min={0} max={32} step={1} onChange={(v) => update("carouselMarginX", v)} suffix="px" />
        <Slider label="顶部边距" value={c.carouselMarginTop} min={0} max={32} step={1} onChange={(v) => update("carouselMarginTop", v)} suffix="px" />
        <Slider label="圆角" value={c.carouselRadius} min={0} max={32} step={1} onChange={(v) => update("carouselRadius", v)} suffix="px" />
        <Slider label="宽高比(分子)" value={parseInt(c.carouselAspect.split("/")[0])} min={2} max={20} step={1} onChange={(v) => update("carouselAspect", `${v}/${c.carouselAspect.split("/")[1]}`)} />
        <Slider label="宽高比(分母)" value={parseInt(c.carouselAspect.split("/")[1])} min={1} max={9} step={1} onChange={(v) => update("carouselAspect", `${c.carouselAspect.split("/")[0]}/${v}`)} />
      </Group>
    );

    if (selected === "gradeBar") return (
      <Group title="所学年级栏" icon={Move}>
        <ImageField label="图标" value={c.gradeIconSrc} onChange={(v) => update("gradeIconSrc", v)} />
        <Slider label="图标大小" value={c.gradeIconSize} min={16} max={48} step={1} onChange={(v) => update("gradeIconSize", v)} suffix="px" />
        <TextField label="标题文字" value={c.gradeTitleText} onChange={(v) => update("gradeTitleText", v)} />
        <Slider label="标题字号" value={c.gradeTitleSize} min={12} max={28} step={1} onChange={(v) => update("gradeTitleSize", v)} suffix="px" />
        <ColorPicker label="标题颜色" value={c.gradeTitleColor} onChange={(v) => update("gradeTitleColor", v)} />
      </Group>
    );

    if (selected === "gradeBtn") return (
      <Group title="年级按钮" icon={Square}>
        <ColorPicker label="渐变起始" value={c.gradeBtnFrom} onChange={(v) => update("gradeBtnFrom", v)} />
        <ColorPicker label="渐变结束" value={c.gradeBtnTo} onChange={(v) => update("gradeBtnTo", v)} />
        <Slider label="圆角" value={c.gradeBtnRadius} min={0} max={40} step={1} onChange={(v) => update("gradeBtnRadius", v)} suffix="px" />
        <Slider label="字号" value={c.gradeBtnTextSize} min={10} max={24} step={1} onChange={(v) => update("gradeBtnTextSize", v)} suffix="px" />
      </Group>
    );

    if (selected === "stats") return (
      <Group title="统计卡片" icon={Palette}>
        <ColorPicker label="边框色" value={c.statBorderColor} onChange={(v) => update("statBorderColor", v)} />
        <ColorPicker label="背景渐变起" value={c.statBgFrom} onChange={(v) => update("statBgFrom", v)} />
        <ColorPicker label="背景渐变止" value={c.statBgTo} onChange={(v) => update("statBgTo", v)} />
        <Slider label="数字字号" value={c.statNumberSize} min={20} max={56} step={1} onChange={(v) => update("statNumberSize", v)} suffix="px" />
        <ColorPicker label="数字颜色" value={c.statNumberColor} onChange={(v) => update("statNumberColor", v)} />
        <Slider label="标签字号" value={c.statLabelSize} min={9} max={18} step={1} onChange={(v) => update("statLabelSize", v)} suffix="px" />
        <ColorPicker label="标签颜色" value={c.statLabelColor} onChange={(v) => update("statLabelColor", v)} />
      </Group>
    );

    if (selected === "subjectCard") return (
      <>
        <Group title="卡片样式" icon={Square}>
          <Slider label="卡片间距" value={c.subjectCardGap} min={4} max={24} step={1} onChange={(v) => update("subjectCardGap", v)} suffix="px" />
          <Slider label="内边距" value={c.subjectCardPadding} min={4} max={24} step={1} onChange={(v) => update("subjectCardPadding", v)} suffix="px" />
          <Slider label="圆角" value={c.subjectCardRadius} min={0} max={28} step={1} onChange={(v) => update("subjectCardRadius", v)} suffix="px" />
          <Slider label="图标框大小" value={c.subjectIconSize} min={28} max={60} step={1} onChange={(v) => update("subjectIconSize", v)} suffix="px" />
          <Slider label="图标框圆角" value={c.subjectIconRadius} min={0} max={30} step={1} onChange={(v) => update("subjectIconRadius", v)} suffix="px" />
          <Slider label="图标图片大小" value={c.subjectIconImgSize} min={20} max={48} step={1} onChange={(v) => update("subjectIconImgSize", v)} suffix="px" />
        </Group>
        <Group title="文字样式" icon={Type}>
          <Slider label="学科名字号" value={c.subjectNameSize} min={14} max={32} step={1} onChange={(v) => update("subjectNameSize", v)} suffix="px" />
          <ColorPicker label="学科名颜色" value={c.subjectNameColor} onChange={(v) => update("subjectNameColor", v)} />
          <Slider label="已学习字号" value={c.subjectLearnedSize} min={10} max={20} step={1} onChange={(v) => update("subjectLearnedSize", v)} suffix="px" />
          <ColorPicker label="已学习颜色" value={c.subjectLearnedColor} onChange={(v) => update("subjectLearnedColor", v)} />
          <Slider label="按钮字号" value={c.subjectBtnSize} min={10} max={20} step={1} onChange={(v) => update("subjectBtnSize", v)} suffix="px" />
          <ColorPicker label="按钮颜色" value={c.subjectBtnColor} onChange={(v) => update("subjectBtnColor", v)} />
        </Group>
        <Group title="进度条" icon={Square}>
          <Slider label="高度" value={c.subjectProgressHeight} min={4} max={20} step={1} onChange={(v) => update("subjectProgressHeight", v)} suffix="px" />
          <Slider label="百分比字号" value={c.subjectRateSize} min={8} max={16} step={1} onChange={(v) => update("subjectRateSize", v)} suffix="px" />
        </Group>
      </>
    );

    // 单个学科编辑
    if (selected?.startsWith("subject-")) {
      const idx = parseInt(selected.split("-")[1]);
      const key = SUBJECT_KEYS[idx];
      const sub = c.subjects[key];
      return (
        <Group title={`${sub.name} 学科`} icon={Palette}>
          <TextField label="学科名称" value={sub.name} onChange={(v) => update(`subjects.${key}.name`, v)} />
          <ColorPicker label="主题色" value={sub.color} onChange={(v) => update(`subjects.${key}.color`, v)} />
          <ImageField label="图标" value={sub.icon} onChange={(v) => update(`subjects.${key}.icon`, v)} />
        </Group>
      );
    }

    return null;
  };

  const hlStyle = (id: string) => highlight === id
    ? { outline: "2px solid #3B82F6", outlineOffset: "-2px", cursor: "pointer" }
    : { cursor: "pointer" };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* 左侧：预览 + 工具栏 */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-4">
        {/* 工具栏 */}
        <div className="flex gap-2 mb-4 flex-wrap justify-center px-4">
          <button onClick={save} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${saved ? "bg-green-500" : "bg-red-600 hover:bg-red-700"}`}>
            <Save size={14} /> {saved ? "已保存!" : "保存并应用"}
          </button>
          <button onClick={() => { setConfig(DEFAULT_HOME_DESIGN); resetHomeDesign(); }} className="px-3 py-2 bg-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-600">
            <RotateCcw size={14} /> 重置
          </button>
          <button onClick={() => refFileRef.current?.click()} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${refImage ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-700 hover:bg-gray-600"}`}>
            <ImagePlus size={14} /> {refImage ? "参考图" : "上传参考图"}
          </button>
          <input ref={refFileRef} type="file" accept="image/*" className="hidden" onChange={uploadRef} />
        </div>

        {/* 参考图透明度 */}
        {refImage && (
          <div className="flex items-center gap-3 mb-3 bg-gray-800 px-4 py-2 rounded-lg w-[375px]">
            <span className="text-[10px] text-gray-400">参考</span>
            <input type="range" min={0} max={1} step={0.05} value={overlayOpacity} onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))} className="flex-1 accent-purple-500" />
            <span className="text-[10px] text-gray-400">预览</span>
            <button onClick={() => setShowRef(!showRef)} className={`px-2 py-0.5 rounded text-[10px] ${showRef ? "bg-purple-600" : "bg-gray-700"}`}>
              {showRef ? "ON" : "OFF"}
            </button>
          </div>
        )}

        {/* 手机预览 */}
        <div className="w-[375px] min-h-[812px] relative" style={{ background: c.pageBg, borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
          {showRef && refImage && (
            <img src={refImage} alt="参考" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 1 - overlayOpacity, zIndex: 0, pointerEvents: "none" }} />
          )}
          <div style={{ position: "relative", zIndex: 1, opacity: overlayOpacity }}>
            {/* 顶部蓝条 */}
            <div onClick={() => setSelected("topBar")} style={hlStyle("1")}>
              <div className="relative" style={{ background: `linear-gradient(180deg, ${c.topGradientFrom} 0%, ${c.topGradientMid} 50%, ${c.topGradientTo} 100%)`, paddingBottom: c.topPaddingBottom }}>
                <div onClick={(e) => { e.stopPropagation(); setSelected("brand"); }} style={hlStyle("2")}>
                  <div style={{ paddingLeft: c.brandPaddingX, paddingRight: c.brandPaddingX, paddingTop: c.brandPaddingTop }}>
                    <img src="/images/ac.png" alt="品牌" style={{ height: c.brandHeight, width: "auto", objectFit: "contain" }} />
                  </div>
                </div>
                <div onClick={(e) => { e.stopPropagation(); setSelected("carousel"); }} style={hlStyle("3")}>
                  <div style={{ marginLeft: c.carouselMarginX, marginRight: c.carouselMarginX, marginTop: c.carouselMarginTop, borderRadius: c.carouselRadius, overflow: "hidden", position: "relative", aspectRatio: c.carouselAspect, background: "#1a1a3e" }}>
                    {SLIDES.map((src, i) => (
                      <div key={src} style={{ position: "absolute", inset: 0, opacity: i === bannerIndex ? 1 : 0, transition: "opacity 0.7s" }}>
                        <img src={src} alt={`轮播${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                    <div style={{ position: "absolute", bottom: 8, right: 12, display: "flex", gap: 6, zIndex: 10 }}>
                      {SLIDES.map((_, i) => (
                        <span key={i} onClick={(e) => { e.stopPropagation(); setBannerIndex(i); }} style={{ width: 6, height: 6, borderRadius: "50%", background: i === bannerIndex ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 内容区 */}
            <div style={{ position: "relative", zIndex: 10, paddingLeft: c.contentPaddingX, paddingRight: c.contentPaddingX, marginTop: c.contentMarginTop, paddingBottom: c.contentPaddingBottom }}>
              {/* 白色卡片 */}
              <div className="overflow-hidden" style={{ background: c.cardBg, borderRadius: c.cardRadius, boxShadow: c.cardShadow }}>
                {/* 所学年级 */}
                <div onClick={() => setSelected("gradeBar")} style={hlStyle("4")}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
                      <img src={c.gradeIconSrc} alt="" style={{ height: c.gradeIconSize, width: c.gradeIconSize, objectFit: "contain" }} />
                      <span style={{ fontSize: c.gradeTitleSize, fontWeight: 700, color: c.gradeTitleColor }}>{c.gradeTitleText}</span>
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); setSelected("gradeBtn"); }} style={{ ...hlStyle("5"), background: `linear-gradient(90deg, ${c.gradeBtnFrom}, ${c.gradeBtnTo})`, borderBottomLeftRadius: c.gradeBtnRadius, padding: `${c.gradeBtnPaddingY}px ${c.gradeBtnPaddingX}px`, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: c.gradeBtnTextSize, fontWeight: 700, color: "#fff" }}>八年级下册</span>
                      <ChevronDown size={18} color="#fff" />
                    </div>
                  </div>
                </div>

                {/* 统计卡片 */}
                <div onClick={() => setSelected("stats")} style={hlStyle("6")}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: c.statGridGap, padding: `4px ${c.statGridPaddingX}px ${c.statGridPaddingBottom}px` }}>
                    {[{v:7,u:"天",l:"坚持学习",i:<Flame size={16} className="text-orange-400" />},{v:23,u:"题",l:"今日答题",i:<Target size={16} className="text-blue-400" />},{v:85,u:"%",l:"正确率",i:<TrendingUp size={16} className="text-green-400" />}].map((s, i) => (
                      <div key={i} style={{ borderRadius: 16, padding: "12px 4px", display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, ${c.statBgFrom}, ${c.statBgTo})`, borderBottom: `3px solid ${c.statBorderColor}`, borderRight: `2px solid ${c.statBorderColor}30`, borderBottomRightRadius: 16 }}>
                        <div style={{ marginBottom: 2 }}>{s.i}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                          <span style={{ fontSize: c.statNumberSize, fontWeight: 900, color: c.statNumberColor, fontStyle: "italic", lineHeight: 1 }}>{s.v}</span>
                          <span style={{ fontSize: c.statUnitSize, fontWeight: 700, color: c.statUnitColor }}>{s.u}</span>
                        </div>
                        <span style={{ fontSize: c.statLabelSize, color: c.statLabelColor, marginTop: 4 }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 学科卡片 */}
              <div onClick={() => setSelected("subjectCard")} style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: c.subjectCardGap }}>
                {textbooks.map((tb, idx) => {
                  const sub = c.subjects[tb.subject as keyof typeof c.subjects] || { color: "#888", name: tb.subject, icon: "" };
                  return (
                    <div key={tb.subject} onClick={(e) => { e.stopPropagation(); setSelected(`subject-${idx}` as ElementKey); }} style={{ ...hlStyle("7"), borderRadius: c.subjectCardRadius, padding: c.subjectCardPadding, background: `linear-gradient(135deg, ${sub.color}10, ${sub.color}05)`, position: "relative", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: c.subjectIconSize, height: c.subjectIconSize, borderRadius: c.subjectIconRadius, background: sub.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {sub.icon && <img src={sub.icon} alt={sub.name} style={{ width: c.subjectIconImgSize, height: c.subjectIconImgSize, objectFit: "contain" }} />}
                        </div>
                        <span style={{ fontSize: c.subjectNameSize, fontWeight: 900, color: c.subjectNameColor, lineHeight: 1 }}>{sub.name}</span>
                      </div>
                      <p style={{ fontSize: c.subjectLearnedSize, color: c.subjectLearnedColor, marginBottom: 4 }}>
                        已学习 <span style={{ fontSize: c.subjectLearnedNumSize, fontWeight: 700, color: c.subjectLearnedNumColor }}>0</span> 道题
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, height: c.subjectProgressHeight, borderRadius: 999, overflow: "hidden", background: `${sub.color}20` }}>
                          <div style={{ height: "100%", borderRadius: 999, width: "0%", background: `linear-gradient(90deg, ${sub.color}CC, ${sub.color})` }} />
                        </div>
                        <span style={{ fontSize: c.subjectRateSize, color: c.subjectRateColor }}>0%</span>
                      </div>
                      <div style={{ textAlign: "center", fontSize: 10, color: c.subjectVersionColor, marginBottom: 8 }}>正确率</div>
                      <div style={{ width: "100%", padding: "6px 0", borderRadius: 999, fontSize: c.subjectBtnSize, fontWeight: 700, color: c.subjectBtnColor, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        去学习 <ChevronRight size={16} style={{ color: c.subjectBtnColor }} />
                      </div>
                      <div style={{ textAlign: "center", fontSize: c.subjectVersionSize, color: c.subjectVersionColor, paddingTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>人教版</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：属性面板 */}
      <div className="w-[320px] bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-orange-400">首页设计器</h1>
            <span className="text-[10px] text-gray-500 ml-auto">点击元素 → 编辑</span>
          </div>
        </div>

        {/* 元素列表 */}
        {!selected && (
          <div className="p-3 grid grid-cols-3 gap-2 border-b border-gray-800">
            {ELEMENTS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setSelected(key)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                <Icon size={16} className="text-blue-400" />
                <span className="text-[9px] text-gray-300 text-center">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 当前编辑的元素名 */}
        {selected && (
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xs">← 返回</button>
            <span className="text-xs font-bold text-blue-400">{ELEMENTS.find(e => e.key === selected)?.label}</span>
          </div>
        )}

        {/* 属性区域 */}
        <div className="flex-1 overflow-y-auto">
          {renderPanel()}
        </div>

        {/* 底部保存 */}
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
          <button onClick={save} className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${saved ? "bg-green-500" : "bg-red-600 hover:bg-red-700"}`}>
            <Save size={16} /> {saved ? "已保存并应用!" : "保存并应用到首页"}
          </button>
        </div>
      </div>
    </div>
  );
}
