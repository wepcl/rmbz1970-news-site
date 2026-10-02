import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertTriangle, Shield, Info } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useAuth } from '@client/src/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      logger.log({ level: 'success', args: ['登录成功', username] });
      navigate('/');
    } catch (err) {
      logger.error('登录失败', err);
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message || '登录失败，请检查用户名和密码'
          : '登录失败，请检查用户名和密码';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 md:py-16">
      <div className="w-full max-w-md">
        <div className="retro-panel p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 mb-4 shadow-lg border-2 border-blue-700">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">用户登录</h2>
            <p className="text-sm text-slate-500 mt-1">
              欢迎回来，请登录您的账号
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  className="retro-input pl-10"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value)
                  }
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  className="retro-input pl-10"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="retro-btn retro-btn-lg retro-btn-block"
              disabled={loading}
            >
              <span className="inline-flex items-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 flex-shrink-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 flex-shrink-0" />
                    登录
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-blue-100 text-center text-sm text-slate-600">
            还没有账号？{' '}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline"
            >
              去注册
            </Link>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-amber-800">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  管理员入口
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  登录管理员账号后，顶部导航栏会显示「后台管理」入口。<br />
                  初始创建者账号：<span className="font-mono bg-amber-100 px-1 rounded">creator</span> / <span className="font-mono bg-amber-100 px-1 rounded">admin123</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
