interface BrushTitleProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSeal?: boolean;
  className?: string;
  text?: string;
  seal?: string;
}

const sizeMap = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

// "AI智能题库" 设计感标题（与首页品牌一致）
// - "AI" 用白→淡蓝渐变填充 + drop-shadow
// - "智能题库" 白色实心 + 阴影
// 外层为 baseline 对齐的 flex，便于在 header 中使用
export default function BrushTitle({ size = "lg", showSeal = false, className = "", text, seal }: BrushTitleProps) {
  // 如果调用方传入自定义 text（非默认），按旧逻辑单色渲染
  const isCustom = text && text !== "中考必胜";
  if (isCustom) {
    return (
      <div className={`flex items-end gap-2 ${className}`}>
        <h1 className={`font-amber ${sizeMap[size]} leading-none`} style={{ color: "#FFFFFF" }}>
          {text}
        </h1>
        {showSeal && (
          <span className="seal-stamp text-[10px] px-1.5 py-0.5 mb-1 font-bold">{seal}</span>
        )}
      </div>
    );
  }

  // 默认渲染 "AI 智能题库" 双色设计感
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span
        className="font-amber leading-none"
        style={{
          fontSize: "var(--ai-font-size, 30px)",
          fontWeight: 900,
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
      <span
        className="font-amber leading-none"
        style={{
          fontSize: "var(--zhineng-font-size, 24px)",
          fontWeight: 800,
          color: "#FFFFFF",
          textShadow: "0 2px 10px rgba(0,0,0,0.2)",
          letterSpacing: 3,
        }}
      >
        智能题库
      </span>
      {showSeal && (
        <span className="seal-stamp text-[10px] px-1.5 py-0.5 mb-1 font-bold">{seal}</span>
      )}
    </div>
  );
}
