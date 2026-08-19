import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { GRADES, getTextbooksByGrade, SUBJECTS } from "@/data/textbooks";
import { useStore } from "@/store/useStore";
import { fetchVersions } from "@/lib/api";
import type { Subject } from "@/data/types";

const SUBJECT_ICONS: Record<string, string> = {
  physics: "/images/icon-physics.png",
  chemistry: "/images/icon-chemistry.png",
  biology: "/images/icon-biology.png",
  politics: "/images/icon-politics.png",
  history: "/images/icon-history.png",
  geography: "/images/icon-geography.png",
};

export default function GradeSelectPage() {
  const navigate = useNavigate();
  const {
    selectedGrade,
    setSelectedGrade,
    selectedVersions,
    setSelectedVersion,
  } = useStore();

  // 本地草稿状态：选中年级 + 各学科版本
  const [draftGrade, setDraftGrade] = useState(selectedGrade);
  const [draftVersions, setDraftVersions] = useState<Record<string, string>>(selectedVersions);
  const [realVersions, setRealVersions] = useState<Record<string, string[]>>({});

  const textbooks = getTextbooksByGrade(draftGrade);

  // 加载当前草稿年级对应的所有学科版本
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        textbooks.map(async (tb) => {
          const vs = await fetchVersions(tb.subject, draftGrade);
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
  }, [draftGrade]);

  const handlePickVersion = (subject: Subject, v: string) => {
    setDraftVersions((prev) => ({ ...prev, [subject]: v }));
  };

  const handleSave = () => {
    // 应用草稿到 store
    setSelectedGrade(draftGrade);
    // 批量写入版本
    for (const [subject, version] of Object.entries(draftVersions)) {
      setSelectedVersion(subject as Subject, version);
    }
    navigate("/app/home");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部蓝色头部 */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: "linear-gradient(180deg, #3B76F7 0%, #3559E8 50%, #2D4CE3 100%)",
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <ArrowLeft size={18} color="#fff" />
          </button>
          <h1 className="font-alibaba font-bold text-white text-[16px]">选择年级</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 我的年级 */}
        <div className="flex items-center gap-2">
          <span className="font-alibaba font-bold text-gray-700 text-[14px]">我的年级：</span>
          <span className="font-alibaba font-black text-[14px]" style={{ color: "#3B76F7" }}>
            {draftGrade}
          </span>
        </div>

        {/* 选择年级 — 白底圆角边框 */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-[11px] text-gray-400 font-alibaba mb-3">所有学段</p>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => {
              const active = draftGrade === g.key;
              return (
                <button
                  key={g.key}
                  onClick={() => setDraftGrade(g.key)}
                  className="px-2 py-2 rounded-xl text-xs font-alibaba border transition-all flex flex-col items-center"
                  style={{
                    background: active ? "#3B76F7" : "#F8FAFC",
                    color: active ? "#fff" : "#374151",
                    borderColor: active ? "#3B76F7" : "#E5E7EB",
                  }}
                >
                  <span className="font-bold">{g.short}</span>
                  <span
                    className="text-[9px] mt-0.5"
                    style={{ color: active ? "rgba(255,255,255,0.85)" : "#9CA3AF" }}
                  >
                    {g.phase}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 选择教材 — 白底圆角边框 */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-[11px] text-gray-400 font-alibaba mb-3">
            选择教材（{draftGrade}）
          </p>

          {textbooks.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-6">该学段暂无学科配置</p>
          ) : (
            <div className="space-y-3">
              {textbooks.map((tb) => {
                const info = SUBJECTS[tb.subject];
                const subIcon = SUBJECT_ICONS[tb.subject];
                const versions = realVersions[tb.subject] || tb.versions;
                const currentVer = draftVersions[tb.subject] || versions[0] || "—";

                return (
                  <div
                    key={tb.subject}
                    className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    {/* 学科图标 */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: info.color,
                      }}
                    >
                      <img
                        src={subIcon}
                        alt={info.name}
                        style={{ width: 26, height: 26, objectFit: "contain" }}
                      />
                    </div>

                    {/* 学科名 + 版本选择 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-alibaba font-bold text-[14px] text-gray-800">
                          {info.name}
                        </span>
                        <span className="text-[10px] text-gray-400">当前：{currentVer}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {versions.map((v) => {
                          const active = v === currentVer;
                          return (
                            <button
                              key={v}
                              onClick={() => handlePickVersion(tb.subject, v)}
                              className="px-2 py-1 rounded-md text-[10px] font-alibaba flex items-center gap-1 transition-all"
                              style={{
                                background: active ? info.color : "#F3F4F6",
                                color: active ? "#fff" : "#6B7280",
                                border: `1px solid ${active ? info.color : "#E5E7EB"}`,
                              }}
                            >
                              {active && <Check size={10} />}
                              <span className="truncate max-w-[140px]">{v}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-full font-alibaba font-bold text-white text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{
            background: "linear-gradient(90deg, #3B76F7, #2D4CE3)",
            boxShadow: "0 6px 16px rgba(59,118,247,0.4)",
          }}
        >
          保存并返回
        </button>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
