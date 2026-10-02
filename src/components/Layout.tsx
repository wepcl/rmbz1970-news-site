import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@client/src/contexts/AuthContext';
import logoUrl from '@client/src/assets/logo.png';
import { Image } from '@client/src/components/ui/image';
import { Settings, Shield } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user && (user.role === 'creator' || user.role === 'admin');

  return (
    <div className="min-h-screen bg-[#f0f4fc] flex flex-col">
      {/* 顶部导航栏 - 古早风格 */}
      <header className="bg-gradient-to-b from-[#1e3a7a] via-[#2a50b8] to-[#1e3a7a] text-white shadow-lg border-b-2 border-[#0e2556]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between min-h-20 py-2">
            {/* Logo 区域 - 左上角（古早报头风格） */}
            <Link to="/" className="flex flex-col items-center gap-1 hover:opacity-90 transition-opacity py-1">
              {/* 第一行：高光底板 + 图标（亮蓝古早立体框，强顶部反光） */}
              <div className="logo-plate">
                <Image
                  src={logoUrl}
                  alt="网站标识"
                />
              </div>
              {/* 第二行：大字报头 - 红色书法风格（大字版） */}
              <span className="text-2xl md:text-3xl font-bold font-serif tracking-widest bg-gradient-to-b from-red-500 to-red-800 bg-clip-text text-transparent drop-shadow-sm leading-tight" style={{ textShadow: '0 1px 0 rgba(139, 0, 0, 0.3)' }}>
                新闻快讯
              </span>
            </Link>

            {/* 主导航 */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold rounded transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                首页
              </NavLink>
              <NavLink
                to="/category"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold rounded transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                新闻分类
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-bold rounded transition-all border-2 ${isActive ? 'bg-yellow-400 text-yellow-900 border-yellow-600 shadow-inner' : 'text-yellow-200 hover:bg-yellow-400/20 border-transparent hover:border-yellow-400/50'}`}
                >
                  <Shield className="w-4 h-4 inline mr-1" />
                  后台管理
                </NavLink>
              )}
            </nav>

            {/* 用户区域 */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold bg-yellow-400 text-yellow-900 rounded border-2 border-yellow-600 shadow-md hover:bg-yellow-300 hover:text-yellow-950 transition-all active:shadow-inner"
                    >
                      <Settings className="w-4 h-4" />
                      后台管理
                    </Link>
                  )}
                  <span className="hidden sm:inline text-sm text-white/80">
                    {user.displayName}
                    <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded">
                      {user.role === 'creator' ? '创建者' : user.role === 'admin' ? '管理员' : '读者'}
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="retro-btn retro-btn-sm"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="retro-btn retro-btn-sm retro-btn-secondary">
                    登录
                  </Link>
                  <Link to="/register" className="retro-btn retro-btn-sm">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 装饰性高光条 */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </header>

      {/* 主内容区 */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <Outlet />
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gradient-to-b from-[#1e3a7a] to-[#142854] text-white/70 text-sm py-5 border-t-2 border-[#0e2556]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 新闻工作室出品. 版权所有</p>
          <p className="text-xs text-white/50 mt-1">复古新闻系统 · 古早互联网风格</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
