import { useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Upload, FileText, Eraser } from "lucide-react";
import { useStore } from "@/store/useStore";
import { SUBJECTS, GRADES, TEXTBOOKS } from "@/data/textbooks";
import { getChapters } from "@/data/chapters";
import { parseDocxToQuestions } from "@/lib/wordParser";
import type { Question, Subject, QuestionType } from "@/data/types";

export default function AdminQuestions() {
  const { questions, addQuestion, addQuestions, updateQuestion, deleteQuestion, clearQuestions } = useStore();
  const [keyword, setKeyword] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<Subject | "">("");
  const [editing, setEditing] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

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
        <div className="flex items-center gap-2 flex-shrink-0">
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
  const [chapterIdx, setChapterIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState<number | "">("");
  const [mode, setMode] = useState<"choice" | "essay">("choice");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  const versions = TEXTBOOKS.filter((t) => t.grade === grade && t.subject === subject).flatMap((t) => t.versions);
  const chapters = getChapters(grade, subject);
  const lessons = chapters[chapterIdx]?.lessons || [];

  // 学科/学段切换时重置版本为第一个
  const ensureVersion = (g: string, s: Subject, cur: string) => {
    const vs = TEXTBOOKS.filter((t) => t.grade === g && t.subject === s).flatMap((t) => t.versions);
    return vs.includes(cur) ? cur : vs[0] || "";
  };

  const handleSubjectChange = (s: Subject) => {
    setSubject(s);
    setVersion(ensureVersion(grade, s, version));
    setChapterIdx(0);
    setLessonIdx("");
  };
  const handleGradeChange = (g: string) => {
    setGrade(g);
    setVersion(ensureVersion(g, subject, version));
    setChapterIdx(0);
    setLessonIdx("");
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
        chapter: chapters[chapterIdx]?.title,
        section: lessonIdx !== "" ? lessons[lessonIdx]?.title : undefined,
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

          {/* 单元 课时 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">单元</label>
              <select
                value={chapterIdx}
                onChange={(e) => { setChapterIdx(Number(e.target.value)); setLessonIdx(""); }}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                {chapters.map((c, i) => (
                  <option key={c.id} value={i}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">课时（可选）</label>
              <select
                value={lessonIdx}
                onChange={(e) => setLessonIdx(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-2 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm"
              >
                <option value="">不指定（整个单元）</option>
                {lessons.map((l, i) => (
                  <option key={l.id} value={i}>{l.title}</option>
                ))}
              </select>
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
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-navy-500/30 bg-navy-50/40 cursor-pointer hover:border-navy-500/60">
              <FileText size={16} className="text-navy-600" />
              <span className="font-kai text-sm text-navy-800/70 flex-1 truncate">
                {file ? file.name : "点击选择 .docx 文件"}
              </span>
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
              />
            </label>
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
