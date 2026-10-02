import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Lock,
  Eye,
  EyeOff,
  UserCircle,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useAuth } from '@client/src/contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'reader' | 'admin'>('reader');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 校验
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (username.trim().length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (!displayName.trim()) {
      setError('请输入显示名称');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const status = await register(
        username.trim(),
        password,
        displayName.trim(),
        role,
      );
      logger.log({
        level: 'info',
        args: ['注册成功', username, status],
      });
      setSuccess(true);
    } catch (err) {
      logger.error('注册失败', err);
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message || '注册失败，请稍后重试'
          : '注册失败，请稍后重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-8 md:py-16">
        <div className="w-full max-w-md">
          <div className="retro-panel p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-green-400 to-green-600 mb-4 shadow-lg border-2 border-green-700">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              注册成功！
            </h2>
            <p className="text-slate-600 mb-6">
              您的账号已提交申请，请等待管理员审批。
              <br />
              审批通过后即可登录使用。
            </p>
            <Link to="/login" className="retro-btn retro-btn-block">
              <span className="inline-flex items-center justify-center gap-2 w-full">
                返回登录
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8 md:py-12">
      <div className="w-full max-w-md">
        <div className="retro-panel p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 mb-4 shadow-lg border-2 border-blue-700">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">用户注册</h2>
            <p className="text-sm text-slate-500 mt-1">
              创建新账号，开启新闻之旅
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
                  placeholder="请输入用户名（至少3位）"
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
                显示名称
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  className="retro-input pl-10"
                  placeholder="请输入显示名称"
                  value={displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDisplayName(e.target.value)
                  }
                  autoComplete="name"
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
                  type={showPassword ? 'text' : 'password'}
                  className="retro-input pl-10 pr-10"
                  placeholder="请输入密码（至少6位）"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="retro-input pl-10 pr-10"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">两次密码不一致</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                注册角色
              </label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="reader"
                    checked={role === 'reader'}
                    onChange={() => setRole('reader')}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div
                    className={`retro-panel p-3 text-center transition-all ${
                      role === 'reader'
                        ? 'border-blue-500 bg-blue-50 shadow-inner'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <UserCircle className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                    <div className="text-sm font-semibold text-slate-800">
                      读者
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      浏览阅读新闻
                    </div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div
                    className={`retro-panel p-3 text-center transition-all ${
                      role === 'admin'
                        ? 'border-blue-500 bg-blue-50 shadow-inner'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Shield className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                    <div className="text-sm font-semibold text-slate-800">
                      管理员
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      发布管理新闻
                    </div>
                  </div>
                </label>
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
                    注册中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    注册
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-blue-100 text-center text-sm text-slate-600">
            已有账号？{' '}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
