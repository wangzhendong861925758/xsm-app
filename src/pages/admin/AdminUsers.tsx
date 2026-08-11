import { useState } from "react";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { GRADES } from "@/data/textbooks";
import type { User } from "@/data/types";

export default function AdminUsers() {
  const { adminUsers, addAdminUser, updateAdminUser, deleteAdminUser } = useStore();
  const [keyword, setKeyword] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = adminUsers.filter((u) => {
    const matchKey = u.nickname.includes(keyword) || u.id.includes(keyword);
    const matchGrade = !gradeFilter || u.grade === gradeFilter;
    return matchKey && matchGrade;
  });

  const handleAdd = () => {
    setEditing({
      id: `u${Date.now()}`,
      nickname: "",
      avatar: "",
      grade: "七年级上册",
      createdAt: Date.now(),
      role: "student",
      stats: {
        streakDays: 0,
        todayAnswered: 0,
        accuracy: 0,
        todayMinutes: 0,
        errorRate: 0,
        mastery: 0,
        rank: 0,
      },
    });
    setShowForm(true);
  };

  const handleSave = (u: User) => {
    const exists = adminUsers.find((item) => item.id === u.id);
    if (exists) {
      updateAdminUser(u);
    } else {
      addAdminUser(u);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <header className="mb-5">
        <h1 className="brush-title text-3xl text-navy-900 mb-1">用户管理</h1>
        <p className="font-kai text-xs text-navy-800/60">共 {adminUsers.length} 位用户</p>
      </header>

      {/* 工具栏 */}
      <div className="ink-card rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索昵称 / ID"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none focus:border-navy-500/50"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none"
        >
          <option value="">全部年级</option>
          {GRADES.map((g) => (
            <option key={g.key} value={g.key}>{g.key}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 btn-navy px-3 py-2 rounded-lg font-kai text-sm"
        >
          <Plus size={15} />
          新增用户
        </button>
      </div>

      {/* 表格 */}
      <div className="ink-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-navy-500/8 text-left">
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">ID</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">昵称</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">年级</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">坚持天数</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">正确率</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">排名</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-navy-500/6 hover:bg-navy-50/40">
                <td className="px-4 py-3 font-mono text-xs text-navy-800/60">{u.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-navy-600/15 text-navy-700 flex items-center justify-center text-xs font-bold">
                      {u.nickname.charAt(0)}
                    </div>
                    <span className="font-kai text-sm text-navy-900">{u.nickname}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-kai text-sm text-navy-900/80">{u.grade}</td>
                <td className="px-4 py-3 font-display text-sm text-navy-900">{u.stats.streakDays}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${u.stats.accuracy >= 80 ? "text-navy-600" : u.stats.accuracy >= 60 ? "text-gold-dark" : "text-gold"}`}>
                    {u.stats.accuracy}%
                  </span>
                </td>
                <td className="px-4 py-3 font-display text-sm text-navy-900">NO.{u.stats.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditing(u); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-navy-500/15 text-navy-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => confirm(`确认删除用户 ${u.nickname}？`) && deleteAdminUser(u.id)}
                      className="p-1.5 rounded-lg hover:bg-gold/15 text-gold-dark"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-kai text-sm text-navy-800/60">
                  暂无匹配用户
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 编辑/新增表单 */}
      {showForm && editing && (
        <UserForm
          user={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function UserForm({
  user,
  onSave,
  onClose,
}: {
  user: User;
  onSave: (u: User) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<User>(user);
  const isNew = !useStore.getState().adminUsers.find((u) => u.id === user.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-900/40 backdrop-blur-sm">
      <div className="bg-paper-light rounded-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="brush-title text-2xl text-navy-900">{isNew ? "新增用户" : "编辑用户"}</h2>
          <button onClick={onClose} className="p-1 text-navy-800/60 hover:text-navy-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">昵称</label>
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none focus:border-navy-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1">年级</label>
            <select
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none"
            >
              {GRADES.map((g) => (
                <option key={g.key} value={g.key}>{g.key}</option>
              ))}
            </select>
          </div>
          {!isNew && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-kai text-navy-800/60 mb-1">坚持天数</label>
                <input
                  type="number"
                  value={form.stats.streakDays}
                  onChange={(e) => setForm({ ...form, stats: { ...form.stats, streakDays: +e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-kai text-navy-800/60 mb-1">正确率%</label>
                <input
                  type="number"
                  value={form.stats.accuracy}
                  onChange={(e) => setForm({ ...form, stats: { ...form.stats, accuracy: +e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-kai text-navy-800/60 mb-1">排名</label>
                <input
                  type="number"
                  value={form.stats.rank}
                  onChange={(e) => setForm({ ...form, stats: { ...form.stats, rank: +e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-kai text-navy-800/60 mb-1">掌握度%</label>
                <input
                  type="number"
                  value={form.stats.mastery}
                  onChange={(e) => setForm({ ...form, stats: { ...form.stats, mastery: +e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-500/15 bg-paper font-kai text-sm focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-navy-500/15 text-navy-900 font-kai text-sm"
          >
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.nickname}
            className={`flex-1 py-2.5 rounded-lg font-kai text-sm font-bold ${
              form.nickname ? "btn-navy" : "bg-navy-500/10 text-navy-800/40"
            }`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
