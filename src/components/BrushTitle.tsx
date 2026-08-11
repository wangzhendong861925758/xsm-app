interface BrushTitleProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSeal?: boolean;
  className?: string;
  text?: string;        // 自定义主标题
  seal?: string;        // 自定义印章文字
}

const sizeMap = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

/**
 * 毛笔字标题 + 深蓝印章
 */
export default function BrushTitle({ size = "lg", showSeal = true, className = "", text, seal }: BrushTitleProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <h1 className={`brush-title ${sizeMap[size]} leading-none`}>{text ?? "中考必胜"}</h1>
      {showSeal && (
        <span className="seal-stamp text-[10px] px-1.5 py-0.5 mb-1 font-bold">{seal ?? "必胜"}</span>
      )}
    </div>
  );
}
