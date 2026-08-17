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

export default function BrushTitle({ size = "lg", showSeal = false, className = "", text, seal }: BrushTitleProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <h1 className={`font-zcool ${sizeMap[size]} leading-none`} style={{ color: "#0088FF" }}>
        {text ?? "中考必胜"}
      </h1>
      {showSeal && (
        <span className="seal-stamp text-[10px] px-1.5 py-0.5 mb-1 font-bold">{seal}</span>
      )}
    </div>
  );
}
