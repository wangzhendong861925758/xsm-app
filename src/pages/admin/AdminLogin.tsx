import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAdminLoggedIn } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 简单 Mock：admin / 123456
    if (username === "admin" && password === "123456") {
      setAdminLoggedIn(true);
      navigate("/admin/users");
    } else {
      setError("账号或密码错误（提示：admin / 123456）");
    }
  };

  return (
    <div className="min-h-screen bg-paper bg-navy-radial flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-navy-600/12 items-center justify-center mb-3">
            <Shield size={28} className="text-navy-600" />
          </div>
          <h1 className="brush-title text-4xl text-navy-900 mb-1">管理后台</h1>
          <p className="font-kai text-xs text-navy-800/60">小四门刷题 · 管理员登录</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="ink-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-kai text-navy-800/60 mb-1.5">管理员账号</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
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

          {error && <p className="text-xs text-gold-dark font-kai">{error}</p>}

          <button
            type="submit"
            className="w-full btn-navy py-2.5 rounded-xl font-kai text-sm font-bold"
          >
            登 录
          </button>

          <p className="text-center text-[10px] text-navy-800/60 font-kai pt-2">
            演示账号：admin / 123456
          </p>
        </form>

        <button
          onClick={() => navigate("/")}
          className="w-full text-center text-xs text-navy-800/60 font-kai mt-4 hover:text-navy-600"
        >
          ← 返回客户端
        </button>
      </div>
    </div>
  );
}
