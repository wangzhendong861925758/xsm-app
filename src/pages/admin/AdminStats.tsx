import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Users, UserCheck, FileQuestion, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { SUBJECTS } from "@/data/textbooks";

export default function AdminStats() {
  const { adminUsers, questions } = useStore();

  const totalUsers = adminUsers.length;
  const activeToday = adminUsers.filter((u) => u.stats.todayAnswered > 0).length;
  const totalQuestions = questions.length;
  const totalAnswered = adminUsers.reduce((acc, u) => acc + u.stats.todayAnswered, 0);

  const cards = [
    { label: "用户总数", value: totalUsers, icon: Users, color: "#0EA5E9", bg: "#E0F2FE" },
    { label: "今日活跃", value: activeToday, icon: UserCheck, color: "#0284C7", bg: "#E0F2FE" },
    { label: "题目总数", value: totalQuestions, icon: FileQuestion, color: "#0369A1", bg: "#E0F2FE" },
    { label: "今日答题量", value: totalAnswered, icon: TrendingUp, color: "#075985", bg: "#E0F2FE" },
  ];

  // 学科题目分布
  const subjectData = Object.values(SUBJECTS).map((s) => ({
    name: s.name,
    count: questions.filter((q) => q.subject === s.key).length,
    color: s.color,
  })).filter((d) => d.count > 0);

  // 用户活跃度（按答题数）
  const userActivity = adminUsers.map((u) => ({
    name: u.nickname,
    answered: u.stats.todayAnswered,
    accuracy: u.stats.accuracy,
  }));

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

        {/* 用户活跃度 */}
        <div className="ink-card rounded-2xl p-4">
          <h2 className="font-kai text-sm font-bold text-navy-900 mb-3">用户今日答题量</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#0369A1", fontFamily: "Noto Serif SC" }}
                  axisLine={{ stroke: "rgba(14,165,233,0.15)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#0369A1" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(14,165,233,0.06)" }}
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(14,165,233,0.15)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="answered" radius={[4, 4, 0, 0]} fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 用户详细列表 */}
      <div className="ink-card rounded-2xl p-4 mt-4">
        <h2 className="font-kai text-sm font-bold text-navy-900 mb-3">用户学习数据</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-500/8 text-left">
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">用户</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">坚持天数</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">今日答题</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">正确率</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">掌握度</th>
                <th className="px-3 py-2 font-kai text-xs text-navy-800/60">排名</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((u) => (
                <tr key={u.id} className="border-t border-navy-500/6">
                  <td className="px-3 py-2 font-kai text-sm text-navy-900">{u.nickname}</td>
                  <td className="px-3 py-2 font-display text-sm text-navy-900">{u.stats.streakDays}</td>
                  <td className="px-3 py-2 font-display text-sm text-navy-900">{u.stats.todayAnswered}</td>
                  <td className="px-3 py-2">
                    <span className={`text-sm font-bold ${u.stats.accuracy >= 80 ? "text-navy-600" : u.stats.accuracy >= 60 ? "text-gold-dark" : "text-gold"}`}>
                      {u.stats.accuracy}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-navy-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-navy-600" style={{ width: `${u.stats.mastery}%` }} />
                      </div>
                      <span className="text-xs text-navy-900">{u.stats.mastery}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-display text-sm text-navy-900">NO.{u.stats.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
