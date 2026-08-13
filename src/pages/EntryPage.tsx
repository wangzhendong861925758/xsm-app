import { useNavigate } from "react-router-dom";
import { BookOpen, Settings } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";

export default function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper bg-navy-radial px-6">
      <div className="mb-12">
        <BrushTitle size="xl" text="小四门精练" seal="中考必胜" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => navigate("/app/home")}
          className="w-full relative overflow-hidden rounded-3xl p-6 text-left group transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)" }}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-2 w-20 h-20 rounded-full bg-white/15" />
          <div className="relative">
            <BookOpen size={32} className="text-white mb-3" />
            <h2 className="brush-title text-2xl text-white mb-1">客户端</h2>
            <p className="text-xs text-white/80 font-kai">学生刷题 · 备考冲刺 · 学情分析</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin")}
          className="w-full ink-card rounded-3xl p-6 text-left group transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-navy-400/40"
        >
          <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center mb-3">
            <Settings size={24} className="text-navy-700" />
          </div>
          <h2 className="font-kai text-2xl font-bold text-navy-900 mb-1">管理端</h2>
          <p className="text-xs text-navy-800/50 font-kai">题库管理 · 用户管理 · 数据统计</p>
        </button>
      </div>

      <p className="mt-8 text-[10px] text-navy-800/30 font-kai">识途EVO · 2026</p>
    </div>
  );
}
