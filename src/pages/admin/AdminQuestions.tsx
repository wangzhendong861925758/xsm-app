import { useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Upload, FileText, Eraser, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { SUBJECTS, GRADES, TEXTBOOKS } from "@/data/textbooks";
import { parseDocxToQuestions, readDocx, splitChoiceByAnswer, splitEssayByQuestion } from "@/lib/wordParser";
import { generateAnalysis, getAIKey, setAIKey } from "@/lib/api";
import type { Question, Subject, QuestionType } from "@/data/types";

export default function AdminQuestions() {
  const { questions, addQuestion, addQuestions, updateQuestion, deleteQuestion, clearQuestions } = useStore();
  const [keyword, setKeyword] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<Subject | "">("");
  const [editing, setEditing] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(!!getAIKey());
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  /** 一键为所有缺解析的题目调用 AI 生成解析+正确思路 */
  const handleGenerateAnalysis = async () => {
    // 选择/判断题：缺 optionAnalysis 就需要生成；大题：缺 analysis 或 solution 就需要生成
    const need = questions.filter((q) => {
      if (q.type === "essay") return !q.analysis || !q.solution;
      return !q.optionAnalysis || q.optionAnalysis.length !== q.options.length;
    });
    if (need.length === 0) {
      setGenMsg({ type: "err", text: "所有题目都已有解析，无需生成" });
      return;
    }
    if (!confirm(`将为 ${need.length} 道缺少解析的题目调用 AI 生成（选择题按选项生成错因，大题生成解析+思路），可能消耗少量 API 额度，是否继续？`)) return;
    setGenLoading(true);
    setGenMsg(null);
    try {
      const updated = await generateAnalysis(need);
      updated.forEach((q) => updateQuestion(q));
      setGenMsg({ type: "ok", text: `已为 ${updated.length} 道题目生成解析` });
    } catch (e) {
      setGenMsg({ type: "err", text: `生成失败：${(e as Error).message}` });
    } finally {
      setGenLoading(false);
    }
  };

  const filtered = questions.filter((q) => {
    const matchKey = q.stem.includes(keyword) || q.id.includes(keyword);
    const matchSubject = !subjectFilter || q.subject === subjectFilter;
    return matchKey && matchSubject;
  });

  const handleAdd = () => {
    setEditing({
      id: `q${Date.now()}`,
      subject: "biology",
      grade: "七年级上册",
      version: "",
      type: "single",
      stem: "",
      options: ["", "", "", ""],
      answer: "",
      analysis: "",
      mastered: false,
      collected: false,
    });
    setShowForm(true);
  };

  const handleSave = (q: Question) => {
    const exists = questions.find((item) => item.id === q.id);
    if (exists) {
      updateQuestion(q);
    } else {
      addQuestion(q);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="brush-title text-3xl text-navy-900 mb-1">题库管理</h1>
          <p className="font-kai text-xs text-navy-800/60">共 {questions.length} 道题目</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={() => { setKeyInput(getAIKey()); setShowKeyModal(true); }}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg font-kai text-sm border ${
              hasKey ? "border-emerald-400/50 text-emerald-700 hover:bg-emerald-50" : "border-red-400/50 text-red-700 hover:bg-red-50"
            }`}
          >
            {hasKey ? "✓ AI Key" : "设置 AI Key"}
          </button>
          <button
            onClick={handleGenerateAnalysis}
            disabled={genLoading || questions.length === 0}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg font-kai text-sm ${
              genLoading ? "bg-navy-500/10 text-navy-800/40" : "border border-purple-400/50 text-purple-700 hover:bg-purple-50"
            }`}
          >
            <Sparkles size={15} />
            {genLoading ? "AI生成中…" : "AI生成解析"}
          </button>
          <button
            onClick={() => {
              if (questions.length === 0) return;
              if (confirm(`确认清空全部 ${questions.length} 道题目？此操作不可恢复，客户端将同步清空。`)) {
                clearQuestions();
              }
            }}
            className="flex items-center gap-1 border border-gold/40 text-gold-dark px-3 py-2 rounded-lg font-kai text-sm hover:bg-gold/10"
          >
            <Eraser size={15} />
            清空题库
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1 border border-navy-500/30 text-navy-700 px-3 py-2 rounded-lg font-kai text-sm hover:bg-navy-500/8"
          >
            <Upload size={15} />
            上传 Word 题库
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 btn-navy px-3 py-2 rounded-lg font-kai text-sm"
          >
            <Plus size={15} />
            新增题目
          </button>
        </div>
      </header>

      {genMsg && (
        <div
          className="mb-3 px-4 py-2 rounded-lg font-kai text-xs"
          style={{
            background: genMsg.type === "ok" ? "rgba(14,165,233,0.08)" : "rgba(234,179,8,0.10)",
            color: genMsg.type === "ok" ? "#0369A1" : "#92400E",
          }}
        >
          {genMsg.text}
        </div>
      )}

      {/* 工具栏 */}
      <div className="ink-card rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索题干 / ID"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none focus:border-navy-500/50"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value as Subject | "")}
          className="px-3 py-2 rounded-lg border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none"
        >
          <option value="">全部学科</option>
          {Object.values(SUBJECTS).map((s) => (
            <option key={s.key} value={s.key}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* 题目列表 */}
      <div className="space-y-2">
        {filtered.map((q) => {
          const info = SUBJECTS[q.subject];
          return (
            <div key={q.id} className="ink-card rounded-xl p-4 flex items-start gap-3">
              <span
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: info.bgColor, color: info.color }}
              >
                {info.shortName}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-500/10 text-navy-800/60 font-kai">
                    {q.grade}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: info.bgColor, color: info.color }}>
                    {q.type === "single" ? "单选" : q.type === "multiple" ? "多选" : "判断"}
                  </span>
                  {q.collected && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-600/12 text-navy-700">已收藏</span>
                  )}
                  {q.mastered && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold-dark">已掌握</span>
                  )}
                </div>
                <p className="font-kai text-sm text-navy-900 line-clamp-1">{q.stem}</p>
                <p className="text-[10px] text-navy-800/60 mt-1 truncate">
                  答案：{Array.isArray(q.answer) ? q.answer.join("、") : q.answer}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { setEditing(q); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-navy-500/15 text-navy-600"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => confirm("确认删除该题目？") && deleteQuestion(q.id)}
                  className="p-1.5 rounded-lg hover:bg-gold/15 text-gold-dark"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="ink-card rounded-xl p-12 text-center font-kai text-sm text-navy-800/60">
            暂无题目
          </div>
        )}
      </div>

      {showForm && editing && (
        <QuestionForm
          question={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {showUpload && (
        <WordUploadForm
          onImport={(qs) => addQuestions(qs)}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-paper rounded-2xl shadow-xl w-full max-w-lg p-6 border-2 border-ink/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="brush-title text-xl text-navy-900">AI API Key 设置</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-navy-800/50 hover:text-navy-900">
                <X size={20} />
              </button>
            </div>
            <p className="font-kai text-sm text-navy-800/70 mb-3">
              请粘贴在 token.xinhankr.com 创建的 API Key（sk- 开头），密钥仅保存在你浏览器本地，不会上传到服务器。
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border-2 border-ink/20 rounded-lg font-mono text-sm focus:border-purple-500 focus:outline-none bg-paper"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setAIKey(""); setKeyInput(""); setHasKey(false); setShowKeyModal(false); }}
                className="px-4 py-2 rounded-lg font-kai text-sm text-navy-800/60 hover:text-red-600"
              >
                清除
              </button>
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-lg font-kai text-sm border border-ink/20 text-navy-800 hover:bg-navy-50"
              >
                取消
              </button>
              <button
                onClick={() => { setAIKey(keyInput); setHasKey(!!keyInput.trim()); setShowKeyModal(false); }}
                className="px-4 py-2 rounded-lg font-kai text-sm bg-purple-600 text-white hover:bg-purple-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 上传 Word 题库弹窗：选学段/学科/版本/单元/课时/题型后上传 .docx 自动拆解 */
function WordUploadForm({
  onImport,
  onClose,
}: {
  onImport: (qs: Question[]) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState<Subject>("biology");
  const [grade, setGrade] = useState("七年级上册");
  const [version, setVersion] = useState("");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [mode, setMode] = useState<"choice" | "essay">("choice");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);
  // 调试预览：显示 mammoth 提取的纯文本和切分结果
  const [debugText, setDebugText] = useState<string>("");
  const [debugBlocks, setDebugBlocks] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const versions = TEXTBOOKS.filter((t) => t.grade === grade && t.subject === subject).flatMap((t) => t.versions);

  // 学科/学段切换时重置版本为第一个
  const ensureVersion = (g: string, s: Subject, cur: string) => {
    const vs = TEXTBOOKS.filter((t) => t.grade === g && t.subject === s).flatMap((t) => t.versions);
    return vs.includes(cur) ? cur : vs[0] || "";
  };

  const handleSubjectChange = (s: Subject) => {
    setSubject(s);
    setVersion(ensureVersion(grade, s, version));
  };
  const handleGradeChange = (g: string) => {
    setGrade(g);
    setVersion(ensureVersion(g, subject, version));
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setResult(null);
    try {
      const ctx = {
        subject,
        grade,
        version,
        chapter: chapter.trim(),
        section: lesson.trim() || undefined,
      };
      const { questions: qs, errors } = await parseDocxToQuestions(file, ctx, mode);
      if (qs.length > 0) onImport(qs);
      setResult({ ok: qs.length, errors });
    } catch (e) {
      setResult({ ok: 0, errors: [`解析失败：${(e as Error).message}`] });
    } finally {
      setParsing(false);
    }
  };

  // 调试预览：读取 docx 纯文本并展示切分结果，帮助定位格式问题
  const handleDebug = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const text = await readDocx(file);
      const blocks = mode === "choice" ? splitChoiceByAnswer(text) : splitEssayByQuestion(text);
      setDebugText(text);
      setDebugBlocks(blocks);
      setShowDebug(true);
    } catch (e) {
      setResult({ ok: 0, errors: [`读取失败：${(e as Error).message}`] });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-900/40 backdrop-blur-sm">
      <div className="bg-paper-light rounded-2xl w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="brush-title text-2xl text-navy-900">上传 Word 题库</h2>
          <button onClick={onClose} className="p-1 text-navy-800/60 hover:text-navy-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* 题型选择 */}
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1.5">题型</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("choice")}
                className={`flex-1 py-2 rounded-lg font-kai text-sm ${
                  mode === "choice" ? "btn-navy font-bold" : "border border-navy-500/15 text-navy-800/70"
                }`}
              >
                选择判断题
              </button>
              <button
                onClick={() => setMode("essay")}
                className={`flex-1 py-2 rounded-lg font-kai text-sm ${
                  mode === "essay" ? "btn-navy font-bold" : "border border-navy-500/15 text-navy-800/70"
                }`}
              >
                大题
              </button>
            </div>
          </div>

          {/* 学段 学科 版本 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">学段</label>
              <select
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                {GRADES.map((g) => (
                  <option key={g.key} value={g.key}>{g.short}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">学科</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value as Subject)}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                {Object.values(SUBJECTS).map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">教材版本</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                {versions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 单元 课时（可编辑文本） */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">单元（自填）</label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="如：第一单元"
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">课时（自填，可选）</label>
              <input
                type="text"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="如：第1课 留空=整个单元"
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
              />
            </div>
          </div>

          {/* 格式说明 */}
          <div className="rounded-lg bg-navy-500/6 p-3 text-[11px] font-kai text-navy-800/60 leading-relaxed">
            {mode === "choice" ? (
              <>选择判断题格式：每题以 <b>1.</b> 开头，选项用 <b>A、 B、 C、 D、</b>，答案用 <b>答案：</b>。可选 <b>解析：</b></>
            ) : (
              <>大题格式：每题以 <b>1.</b> 开头，题干以 <b>问：</b> 开头，答案以 <b>答：</b> 开头</>
            )}
          </div>

          {/* 文件选择 */}
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">Word 文件（.docx）</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-navy-500/30 bg-navy-50/40 cursor-pointer hover:border-navy-500/60">
                <FileText size={16} className="text-navy-600" />
                <span className="font-kai text-sm text-navy-800/70 flex-1 truncate">
                  {file ? file.name : "点击选择 .docx 文件"}
                </span>
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setDebugText(""); setDebugBlocks([]); setShowDebug(false); }}
                />
              </label>
              <button
                onClick={handleDebug}
                disabled={!file || parsing}
                className="px-3 py-2.5 rounded-lg border border-navy-500/30 text-navy-700 font-kai text-sm hover:bg-navy-500/8 disabled:opacity-40"
              >
                调试预览
              </button>
            </div>
          </div>

          {/* 结果 */}
          {result && (
            <div className="rounded-lg p-3 text-xs font-kai" style={{
              background: result.ok > 0 ? "rgba(14,165,233,0.08)" : "rgba(234,179,8,0.10)",
              color: result.ok > 0 ? "#0369A1" : "#92400E",
            }}>
              <p>成功导入 {result.ok} 道题目{result.errors.length > 0 ? `，${result.errors.length} 题拆解失败` : ""}</p>
              {result.errors.length > 0 && (
                <ul className="mt-1 list-disc list-inside opacity-70">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* 调试预览面板 */}
          {showDebug && (
            <div className="rounded-lg border border-navy-500/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-kai text-xs font-bold text-navy-900">调试预览（切出 {debugBlocks.length} 个题块）</p>
                <button onClick={() => setShowDebug(false)} className="text-navy-800/50 hover:text-navy-900">
                  <X size={14} />
                </button>
              </div>
              <div>
                <p className="font-kai text-[11px] text-navy-800/60 mb-1">① mammoth 提取的纯文本（前 800 字）：</p>
                <pre className="text-[10px] bg-navy-50/60 rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono">{debugText.slice(0, 800)}{debugText.length > 800 ? "…" : ""}</pre>
              </div>
              <div>
                <p className="font-kai text-[11px] text-navy-800/60 mb-1">② 切分出的题块（每个块前 200 字）：</p>
                <div className="space-y-1.5 max-h-60 overflow-auto">
                  {debugBlocks.length === 0 ? (
                    <p className="text-[10px] text-gold-dark font-kai">⚠ 没有切出任何题块。选择判断题需要每题有"答案："行；大题需要每题以"N.问："开头。</p>
                  ) : (
                    debugBlocks.map((b, i) => (
                      <div key={i} className="text-[10px] bg-navy-50/60 rounded p-2">
                        <p className="font-bold text-navy-700 mb-0.5">块 {i + 1}：</p>
                        <pre className="whitespace-pre-wrap font-mono">{b.slice(0, 200)}{b.length > 200 ? "…" : ""}</pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <p className="font-kai text-[10px] text-navy-800/50">
                把上面的内容截图发我，我就能定位格式问题。
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-navy-500/15 text-navy-900 font-kai text-sm">
            关闭
          </button>
          <button
            onClick={handleParse}
            disabled={!file || parsing}
            className={`flex-1 py-2.5 rounded-lg font-kai text-sm font-bold flex items-center justify-center gap-1.5 ${
              file && !parsing ? "btn-navy" : "bg-navy-500/10 text-navy-800/40"
            }`}
          >
            <Upload size={15} />
            {parsing ? "解析中…" : "解析并导入"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionForm({
  question,
  onSave,
  onClose,
}: {
  question: Question;
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Question>(question);
  const isNew = !useStore.getState().questions.find((q) => q.id === question.id);

  // 根据年级学科获取版本
  const versions = TEXTBOOKS.filter((t) => t.grade === form.grade && t.subject === form.subject).flatMap((t) => t.versions);

  const updateOption = (i: number, val: string) => {
    const opts = [...form.options];
    opts[i] = val;
    setForm({ ...form, options: opts });
  };

  const addOption = () => setForm({ ...form, options: [...form.options, ""] });
  const removeOption = (i: number) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });

  const handleTypeChange = (type: QuestionType) => {
    if (type === "judge") {
      setForm({ ...form, type, options: ["正确", "错误"] });
    } else {
      setForm({ ...form, type, options: form.options.length < 4 ? ["", "", "", ""] : form.options });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-900/40 backdrop-blur-sm">
      <div className="bg-paper-light rounded-2xl w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-paper-light pb-2">
          <h2 className="brush-title text-2xl text-navy-900">{isNew ? "新增题目" : "编辑题目"}</h2>
          <button onClick={onClose} className="p-1 text-navy-800/60 hover:text-navy-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">学科</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                {Object.values(SUBJECTS).map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">年级</label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                {GRADES.map((g) => (
                  <option key={g.key} value={g.short}>{g.short}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">题型</label>
              <select
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">教材版本</label>
            <select
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
            >
              <option value="">请选择版本</option>
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">题干</label>
            <textarea
              value={form.stem}
              onChange={(e) => setForm({ ...form, stem: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-kai text-navy-800/60">选项</label>
              {form.type !== "judge" && (
                <button onClick={addOption} className="text-xs text-navy-600 font-kai">+ 添加选项</button>
              )}
            </div>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-navy-500/10 flex items-center justify-center text-[10px] font-bold text-navy-900">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
                  />
                  {form.type !== "judge" && form.options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-gold-dark p-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">正确答案</label>
            <input
              value={Array.isArray(form.answer) ? form.answer.join("、") : form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="填写正确选项内容，多选用、分隔"
              className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">解析</label>
            <textarea
              value={form.analysis}
              onChange={(e) => setForm({ ...form, analysis: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5 sticky bottom-0 bg-paper-light pt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-navy-500/15 text-navy-900 font-kai text-sm"
          >
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.stem || !form.answer}
            className={`flex-1 py-2.5 rounded-lg font-kai text-sm font-bold ${
              form.stem && form.answer ? "btn-navy" : "bg-navy-500/10 text-navy-800/40"
            }`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
