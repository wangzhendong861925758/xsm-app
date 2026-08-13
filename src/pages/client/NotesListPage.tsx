import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { EXPERT_NOTES } from "@/data/expertNotes";

const SUBJECT_COLORS: Record<string, string> = {
  生物: "#0EA5E9",
  历史: "#0369A1",
  地理: "#0284C7",
  道法: "#075985",
};

export default function NotesListPage() {
  const navigate = useNavigate();

  // 按学科分组
  const subjects = ["生物", "历史", "地理", "道法"] as const;

  return (
    <div className="min-h-full bg-paper bg-navy-radial">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 sticky top-0 bg-paper-light/95 backdrop-blur z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <div className="flex-1">
          <h1 className="font-kai text-sm font-bold text-navy-900">学霸笔记</h1>
          <p className="text-[10px] text-navy-800/50 font-kai">
            2026专家考点 · 共{EXPERT_NOTES.length}篇
          </p>
        </div>
        <Award size={18} className="text-gold-dark" />
      </header>

      <main className="px-4 py-4 space-y-5">
        {subjects.map((subj) => {
          const notes = EXPERT_NOTES.filter((n) => n.subject === subj);
          if (notes.length === 0) return null;
          const color = SUBJECT_COLORS[subj];
          return (
            <section key={subj}>
              <h2
                className="font-kai text-sm font-bold mb-2 flex items-center gap-1.5"
                style={{ color }}
              >
                <span
                  className="w-1.5 h-4 rounded-full"
                  style={{ background: color }}
                />
                {subj} · {notes.length}篇
              </h2>
              <div className="space-y-2">
                {notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => navigate(`/app/note/${n.id}`)}
                    className="w-full ink-card rounded-xl p-3 flex items-center gap-2 text-left hover:border-navy-400/40 transition-all"
                  >
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold font-kai"
                      style={{ background: `${color}15`, color }}
                    >
                      {n.category}
                    </span>
                    <span className="font-kai text-xs text-navy-900 flex-1 line-clamp-1">
                      {n.title}
                    </span>
                    <ChevronRight size={14} className="text-navy-800/30 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
