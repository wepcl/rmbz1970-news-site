import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Newspaper,
  FilePlus,
  LogOut,
  Shield,
  Lock,
} from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';
import { logger } from '@/lib/logger';

const roleLabelMap: Record<string, string> = {
  creator: '创建者',
  admin: '管理员',
  reader: '读者',
};

const AdminLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'creator';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="retro-panel p-8 text-center">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="retro-panel p-8 text-center max-w-md w-full">
          <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">无权限访问</h2>
          <p className="text-slate-600 mb-6">
            该页面仅管理员和创建者可访问，请登录后重试。
          </p>
          <button
            type="button"
            className="retro-btn retro-btn-block"
            onClick={() => navigate('/login')}
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/admin', label: '管理首页', icon: LayoutDashboard, end: true },
    { path: '/admin/registrations', label: '注册审批', icon: UserCheck },
    { path: '/admin/users', label: '用户管理', icon: Users },
    { path: '/admin/articles', label: '新闻管理', icon: Newspaper },
    { path: '/admin/articles/create', label: '发布新闻', icon: FilePlus },
  ];

  const handleNavError = (e: React.MouseEvent<HTMLAnchorElement>) => {
    logger.error('导航跳转异常', e);
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gradient-to-b from-slate-700 to-slate-800 text-white flex flex-col shadow-lg">
        <div className="p-4 border-b border-slate-600">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-300" />
            复古新闻后台
          </h1>
        </div>
        <nav className="flex-1 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={handleNavError}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-4 ${
                    isActive
                      ? 'bg-blue-600/30 border-blue-400 text-white'
                      : 'border-transparent text-slate-300 hover:bg-slate-600/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-600">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600/50 hover:text-white rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="retro-panel rounded-none border-t-0 border-x-0 px-6 py-3 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">后台管理系统</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">
                {user.displayName}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                <Shield className="w-3 h-3" />
                <span
                  className={`retro-badge retro-badge-${
                    user.role === 'creator' ? 'yellow' : 'blue'
                  }`}
                >
                  {roleLabelMap[user.role] || user.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
