import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Tag } from "lucide-react";
import { EXPERT_NOTES } from "@/data/expertNotes";
import { useStore } from "@/store/useStore";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { siteConfig } = useStore();

  const note = EXPERT_NOTES.find((n) => n.id === id);

  if (!note) {
    return (
      <div className="min-h-full flex items-center justify-center bg-paper">
        <p className="font-kai text-sm text-navy-800/50">笔记不存在</p>
      </div>
    );
  }

  const subjectColors: Record<string, string> = {
    "生物": "#0EA5E9",
    "历史": "#0369A1",
    "地理": "#0284C7",
    "道法": "#075985",
  };
  const color = subjectColors[note.subject] || "#0369A1";

  return (
    <div className="min-h-full bg-white">
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-navy-500/10 sticky top-0 bg-white z-30">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-navy-900" />
        </button>
        <h1 className="font-kai text-sm font-bold text-navy-900 flex-1 truncate">学霸笔记</h1>
        <span className="text-[10px] text-navy-800/50 font-kai">识途EVO</span>
      </header>

      <main className="px-5 py-4">
        {/* 标题区 */}
        <div className="ink-card rounded-2xl p-4 mb-4" style={{ borderTop: `3px solid ${color}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold font-kai"
              style={{ background: `${color}15`, color }}
            >
              {note.category}
            </span>
            <Tag size={12} style={{ color }} />
          </div>
          <h2 className="font-kai text-base font-bold text-navy-900 leading-relaxed">
            {note.title}
          </h2>
        </div>

        {/* 正文 */}
        <div className="ink-card rounded-2xl p-4">
          <pre className="font-kai text-sm text-navy-900 leading-relaxed whitespace-pre-wrap break-words">
{note.content}
          </pre>
        </div>

        {/* 来源 */}
        <div className="mt-4 px-2">
          <p className="text-[10px] text-navy-800/40 font-kai">来源：{note.source}</p>
        </div>
      </main>
    </div>
  );
}
