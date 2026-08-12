import { useState } from "react";
import { Search, KeyRound, X, ShieldCheck, ShieldOff, UserCheck, Ban } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function AdminUsers() {
  const { clientAccounts, grantClientByCode, revokeClientByCode } = useStore();
  const [keyword, setKeyword] = useState("");
  const [showGrant, setShowGrant] = useState(false);
  const [grantCode, setGrantCode] = useState("");
  const [grantMonths, setGrantMonths] = useState(1);
  const [grantMsg, setGrantMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = clientAccounts.filter(
    (a) => a.code.includes(keyword) || a.studentName.includes(keyword) || a.username.includes(keyword),
  );
  const grantedCount = clientAccounts.filter((a) => a.granted).length;

  const handleGrant = async () => {
    const code = grantCode.trim();
    if (!/^\d{8}$/.test(code)) {
      setGrantMsg({ type: "err", text: "请输入 8 位数字 ID" });
      return;
    }
    setGrantMsg({ type: "ok", text: "正在查询..." });
    const ok = await grantClientByCode(code, grantMonths);
    if (ok) {
      setGrantMsg({ type: "ok", text: `已为 ID ${code} 开放 ${grantMonths} 个月权限` });
      setGrantCode("");
    } else {
      setGrantMsg({ type: "err", text: `ID ${code} 不存在，请确认客户端已注册` });
    }
  };

  const handleRevoke = async (code: string, name: string) => {
    if (confirm(`确认撤销 ${name}（${code}）的答题权限？`)) {
      await revokeClientByCode(code);
    }
  };

  const formatExpiry = (expiresAt: number | null, granted: boolean) => {
    if (!granted || !expiresAt) return "—";
    const d = new Date(expiresAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div>
      <header className="mb-5">
        <h1 className="brush-title text-3xl text-navy-900 mb-1">用户管理</h1>
        <p className="font-kai text-xs text-navy-800/60">
          共 {clientAccounts.length} 位注册用户 · 已授权 {grantedCount} 位
        </p>
      </header>

      {/* 工具栏 */}
      <div className="ink-card rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索 ID / 姓名 / 用户名"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none focus:border-navy-500/50"
          />
        </div>
        <button
          onClick={() => { setShowGrant(true); setGrantMsg(null); setGrantCode(""); setGrantMonths(1); }}
          className="flex items-center gap-1 btn-navy px-3 py-2 rounded-lg font-kai text-sm"
        >
          <KeyRound size={15} />
          为客户端添加权限
        </button>
      </div>

      {/* 表格 */}
      <div className="ink-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-navy-500/8 text-left">
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">8位 ID</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">学生姓名</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">用户名</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">权限状态</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">到期时间</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold">注册时间</th>
              <th className="px-4 py-3 font-kai text-xs text-navy-800/60 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.code} className="border-t border-navy-500/6 hover:bg-navy-50/40">
                <td className="px-4 py-3 font-mono text-sm text-navy-700 font-bold tracking-wider">{a.code}</td>
                <td className="px-4 py-3 font-kai text-sm text-navy-900">{a.studentName}</td>
                <td className="px-4 py-3 font-kai text-sm text-navy-800/70">{a.username}</td>
                <td className="px-4 py-3">
                  {a.granted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-kai text-navy-700 bg-navy-500/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={12} /> 已授权
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-kai text-gold-dark bg-gold/10 px-2 py-0.5 rounded-full">
                      <ShieldOff size={12} /> 未授权
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-kai text-xs text-navy-800/60">
                  {formatExpiry(a.expiresAt, a.granted)}
                </td>
                <td className="px-4 py-3 font-kai text-xs text-navy-800/50">
                  {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-right">
                  {a.granted && (
                    <button
                      onClick={() => handleRevoke(a.code, a.studentName)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-kai text-gold-dark hover:bg-gold/10"
                    >
                      <Ban size={12} />
                      撤销权限
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-kai text-sm text-navy-800/60">
                  {clientAccounts.length === 0 ? "暂无注册用户，等待客户端注册" : "暂无匹配用户"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 为客户端添加权限弹窗 */}
      {showGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-900/40 backdrop-blur-sm">
          <div className="bg-paper-light rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="brush-title text-2xl text-navy-900">为客户端添加权限</h2>
              <button onClick={() => setShowGrant(false)} className="p-1 text-navy-800/60 hover:text-navy-900">
                <X size={20} />
              </button>
            </div>
            <p className="font-kai text-xs text-navy-800/60 mb-3">
              输入客户端用户注册后获得的 8 位数字 ID，开放其答题权限。
            </p>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1">8 位数字 ID</label>
              <input
                value={grantCode}
                onChange={(e) => { setGrantCode(e.target.value.replace(/\D/g, "").slice(0, 8)); setGrantMsg(null); }}
                placeholder="请输入 8 位数字 ID"
                className="w-full px-3 py-2.5 rounded-lg border border-navy-500/15 bg-paper font-mono text-lg tracking-[0.3em] text-navy-900 focus:outline-none focus:border-navy-500/50"
                maxLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1.5">有效期限</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setGrantMonths(m)}
                    className={`py-2 rounded-lg font-kai text-sm transition-all ${
                      grantMonths === m
                        ? "btn-navy font-bold"
                        : "border border-navy-500/15 text-navy-800/70 hover:border-navy-500/40"
                    }`}
                  >
                    {m} 个月
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-navy-800/50 mt-1.5 font-kai">
                到期后客户端将自动取消权限，需重新授权
              </p>
            </div>
            {grantMsg && (
              <p className={`text-xs font-kai mt-2 ${grantMsg.type === "ok" ? "text-navy-600" : "text-gold-dark"}`}>
                {grantMsg.text}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowGrant(false)}
                className="flex-1 py-2.5 rounded-lg border border-navy-500/15 text-navy-900 font-kai text-sm"
              >
                关闭
              </button>
              <button
                onClick={handleGrant}
                disabled={grantCode.length !== 8}
                className={`flex-1 py-2.5 rounded-lg font-kai text-sm font-bold flex items-center justify-center gap-1.5 ${
                  grantCode.length === 8 ? "btn-navy" : "bg-navy-500/10 text-navy-800/40"
                }`}
              >
                <UserCheck size={15} />
                开放权限
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
