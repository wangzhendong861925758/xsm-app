import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, IdCard, UserPlus, LogIn } from "lucide-react";
import BrushTitle from "@/components/BrushTitle";
import { useStore } from "@/store/useStore";

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const { registerClient, loginClient } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState("");
  // 注册成功后展示的 8 位 ID
  const [newCode, setNewCode] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("请输入用户名和密码");
      return;
    }
    const ok = await loginClient(username, password);
    if (ok) {
      navigate("/app/home", { replace: true });
    } else {
      setError("用户名或密码错误");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password || !studentName) {
      setError("请填写完整信息");
      return;
    }
    const code = await registerClient(username, password, studentName);
    if (!code) {
      setError("该用户名已存在");
      return;
    }
    setNewCode(code);
  };

  // 注册成功提示：展示 ID 并引导登录
  if (newCode) {
    return (
      <div className="min-h-screen bg-paper bg-navy-radial flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-navy-600/12 items-center justify-center mb-3">
            <IdCard size={28} className="text-navy-600" />
          </div>
          <h1 className="brush-title text-3xl text-navy-900 mb-1">注册成功</h1>
          <p className="font-kai text-xs text-navy-800/60 mb-6">
            请记下你的专属 ID，凭此 ID 联系管理员开放答题权限
          </p>
          <div className="ink-card rounded-2xl p-6 mb-4">
            <p className="font-kai text-xs text-navy-800/50 mb-2">我的专属 ID</p>
            <p className="font-display text-4xl font-bold tracking-[0.3em] text-navy-600">
              {newCode}
            </p>
            <p className="text-[10px] text-gold-dark font-kai mt-3">
              提示：未开放权限前无法答题，请将此 ID 发送给管理员
            </p>
          </div>
          <button
            onClick={() => {
              setNewCode(null);
              setMode("login");
              setPassword("");
            }}
            className="w-full btn-navy py-2.5 rounded-xl font-kai text-sm font-bold"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper bg-navy-radial flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrushTitle size="lg" />
          </div>
          <p className="font-kai text-xs text-navy-800/60">
            {mode === "login" ? "欢迎回来 · 继续学习" : "新同学注册 · 开启刷题之旅"}
          </p>
        </div>

        {/* 切换标签 */}
        <div className="flex bg-navy-500/8 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-lg font-kai text-sm transition-all ${
              mode === "login" ? "bg-paper text-navy-600 font-bold shadow-sm" : "text-navy-800/50"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 rounded-lg font-kai text-sm transition-all ${
              mode === "register" ? "bg-paper text-navy-600 font-bold shadow-sm" : "text-navy-800/50"
            }`}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="ink-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1.5">用户名</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none focus:border-navy-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1.5">密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none focus:border-navy-500/50"
              />
            </div>
          </div>
          {mode === "register" && (
            <div>
              <label className="block text-xs font-kai text-navy-800/60 mb-1.5">学生姓名</label>
              <div className="relative">
                <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="请输入学生姓名"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-500/15 bg-navy-50/40 font-kai text-sm focus:outline-none focus:border-navy-500/50"
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-gold-dark font-kai">{error}</p>}

          <button
            type="submit"
            className="w-full btn-navy py-2.5 rounded-xl font-kai text-sm font-bold flex items-center justify-center gap-1.5"
          >
            {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mode === "login" ? "登 录" : "注 册"}
          </button>
        </form>
      </div>
    </div>
  );
}
