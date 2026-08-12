import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, UserCheck, FileQuestion, ShieldOff } from "lucide-react";
import { useStore } from "@/store/useStore";
import { SUBJECTS } from "@/data/textbooks";

export default function AdminStats() {
  const { clientAccounts, questions } = useStore();

  // 仅统计已获得权限的客户端用户
  const grantedAccounts = clientAccounts.filter((a) => a.granted);
  const totalGranted = grantedAccounts.length;
  const totalPending = clientAccounts.length - totalGranted;
  const totalQuestions = questions.length;
  const todayAnsweredTotal = useStore.getState().todayStats
    ? Object.values(useStore.getState().todayStats).reduce((acc, s) => acc + s.total, 0)
    : 0;

  const cards = [
    { label: "已授权用户", value: totalGranted, icon: Users, color: "#0EA5E9", bg: "#E0F2FE" },
    { label: "待授权用户", value: totalPending, icon: ShieldOff, color: "#EA580C", bg: "#FFF7ED" },
    { label: "题目总数", value: totalQuestions, icon: FileQuestion, color: "#0369A1", bg: "#E0F2FE" },
    { label: "今日答题量", value: todayAnsweredTotal, icon: UserCheck, color: "#075985", bg: "#E0F2FE" },
  ];

  // 学科题目分布
  const subjectData = Object.values(SUBJECTS).map((s) => ({
    name: s.name,
    count: questions.filter((q) => q.subject === s.key).length,
    color: s.color,
  })).filter((d) => d.count > 0);

  // 已授权用户列表（按注册时间倒序）
  const grantedList = [...grantedAccounts].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <header className="mb-5">
        <h1 className="brush-title text-3xl text-navy-900 mb-1">数据统计</h1>
        <p className="font-kai text-xs text-navy-800/60">平台运营数据概览</p>
      </header>

      {/* 数据卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="ink-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: c.bg }}
              >
                <c.icon size={20} style={{ color: c.color }} />
              </div>
            </div>
            <p className="font-display text-3xl text-navy-900 font-bold leading-none">{c.value}</p>
            <p className="font-kai text-xs text-navy-800/60 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 学科题目分布 */}
        <div className="ink-card rounded-2xl p-4">
          <h2 className="font-kai text-sm font-bold text-navy-900 mb-3">题目学科分布</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  label={(entry: { name: string; count: number }) => `${entry.name} ${entry.count}`}
                  labelLine={false}
                  fontSize={11}
                >
                  {subjectData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(14,165,233,0.15)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 授权状态分布 */}
        <div className="ink-card rounded-2xl p-4">
          <h2 className="font-kai text-sm font-bold text-navy-900 mb-3">用户授权状态</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "已授权", value: totalGranted, color: "#0EA5E9" },
                    { name: "待授权", value: totalPending, color: "#EA580C" },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  label={(entry: { name: string; value: number }) => `${entry.name} ${entry.value}`}
                  labelLine={false}
                  fontSize={11}
                >
                  <Cell fill="#0EA5E9" />
                  <Cell fill="#EA580C" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(14,165,233,0.15)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 已授权用户列表 */}
      <div className="ink-card rounded-2xl p-4 mt-4">
        <h2 className="font-kai text-sm font-bold text-navy-900 mb-3">
          已授权用户（{totalGranted} 位）
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-500/8 text-left">
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">8位 ID</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">学生姓名</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">用户名</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {grantedList.map((a) => (
                <tr key={a.code} className="border-t border-navy-500/6">
                  <td className="px-3 py-2 font-mono text-sm text-navy-700 font-bold tracking-wider">{a.code}</td>
                  <td className="px-3 py-2 font-kai text-sm text-navy-900">{a.studentName}</td>
                  <td className="px-3 py-2 font-kai text-sm text-navy-800/70">{a.username}</td>
                  <td className="px-3 py-2 font-kai text-xs text-navy-800/50">
                    {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
              {grantedList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center font-kai text-sm text-navy-800/60">
                    暂无已授权用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
