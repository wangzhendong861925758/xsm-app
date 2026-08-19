/** 首页可视化设计配置 — 管理端编辑后持久化到 store，首页实时读取 */

export interface SubjectDesignConfig {
  color: string;
  name: string;
  icon: string;
}

export interface HomeDesignConfig {
  pageBg: string;
  topGradientFrom: string;
  topGradientMid: string;
  topGradientTo: string;
  topPaddingBottom: number;
  brandHeight: number;
  brandPaddingX: number;
  brandPaddingTop: number;
  carouselMarginX: number;
  carouselMarginTop: number;
  carouselRadius: number;
  carouselAspect: string;
  contentMarginTop: number;
  contentPaddingX: number;
  contentPaddingBottom: number;
  cardBg: string;
  cardRadius: number;
  cardShadow: string;
  gradeIconSrc: string;
  gradeIconSize: number;
  gradeTitleText: string;
  gradeTitleSize: number;
  gradeTitleColor: string;
  gradeBtnFrom: string;
  gradeBtnTo: string;
  gradeBtnRadius: number;
  gradeBtnTextSize: number;
  gradeBtnPaddingX: number;
  gradeBtnPaddingY: number;
  statBorderColor: string;
  statBgFrom: string;
  statBgTo: string;
  statNumberSize: number;
  statNumberColor: string;
  statUnitSize: number;
  statUnitColor: string;
  statLabelSize: number;
  statLabelColor: string;
  statGridGap: number;
  statGridPaddingX: number;
  statGridPaddingBottom: number;
  subjectCardGap: number;
  subjectCardPadding: number;
  subjectCardRadius: number;
  subjectIconSize: number;
  subjectIconRadius: number;
  subjectIconImgSize: number;
  subjectNameSize: number;
  subjectNameColor: string;
  subjectLearnedSize: number;
  subjectLearnedColor: string;
  subjectLearnedNumSize: number;
  subjectLearnedNumColor: string;
  subjectProgressHeight: number;
  subjectProgressRadius: number;
  subjectRateSize: number;
  subjectRateColor: string;
  subjectBtnColor: string;
  subjectBtnSize: number;
  subjectVersionSize: number;
  subjectVersionColor: string;
  subjects: Record<string, SubjectDesignConfig>;
}

export const DEFAULT_HOME_DESIGN: HomeDesignConfig = {
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
  subjects: {
    physics: { color: "#E83E3E", name: "物理", icon: "/images/icon-physics.png" },
    chemistry: { color: "#22C593", name: "化学", icon: "/images/icon-chemistry.png" },
    biology: { color: "#EC4899", name: "生物", icon: "/images/icon-biology.png" },
    politics: { color: "#7C3AED", name: "道法", icon: "/images/icon-politics.png" },
    history: { color: "#F59E0B", name: "历史", icon: "/images/icon-history.png" },
    geography: { color: "#22C55E", name: "地理", icon: "/images/icon-geography.png" },
  },
};
