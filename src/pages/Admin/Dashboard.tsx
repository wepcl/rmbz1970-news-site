import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  FileClock,
  Users,
  Newspaper,
  UserPlus,
  FilePlus,
  Settings,
} from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';
import { newsApi } from '@client/src/api';
import { logger } from '@/lib/logger';
import type { UserListResponse, ArticleListResponse } from '@shared/api.interface';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingRegs, setPendingRegs] = useState<number>(0);
  const [pendingArticles, setPendingArticles] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [publishedArticles, setPublishedArticles] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      setLoading(true);
      setError('');

      const fetchPendingRegs = async (): Promise<number> => {
        try {
          const res: UserListResponse = await newsApi.getPendingRegistrations({ page: 1, pageSize: 1 });
          return res.total ?? 0;
        } catch (err: unknown) {
          logger.error('加载待审批注册数失败', err);
          return 0;
        }
      };

      const fetchPendingArticles = async (): Promise<number> => {
        try {
          const res: ArticleListResponse = await newsApi.getPendingApprovalArticles({ page: 1, pageSize: 1 });
          return res.total ?? 0;
        } catch (err: unknown) {
          logger.error('加载待审批新闻数失败', err);
          return 0;
        }
      };

      const fetchTotalUsers = async (): Promise<number> => {
        try {
          const res: UserListResponse = await newsApi.getUsers({ page: 1, pageSize: 1 });
          return res.total ?? 0;
        } catch (err: unknown) {
          logger.error('加载用户总数失败', err);
          return 0;
        }
      };

      const fetchPublishedArticles = async (): Promise<number> => {
        try {
          const res: ArticleListResponse = await newsApi.getAdminArticles({
            page: 1,
            pageSize: 1,
            status: 'published',
          });
          return res.total ?? 0;
        } catch (err: unknown) {
          logger.error('加载已发布新闻数失败', err);
          return 0;
        }
      };

      const [regs, articles, users, published] = await Promise.all([
        fetchPendingRegs(),
        fetchPendingArticles(),
        fetchTotalUsers(),
        fetchPublishedArticles(),
      ]);

      setPendingRegs(regs);
      setPendingArticles(articles);
      setTotalUsers(users);
      setPublishedArticles(published);
      setLoading(false);
    };
    void loadStats();
  }, []);

  const statCards = [
    {
      label: '待审批注册',
      value: pendingRegs,
      icon: UserCheck,
      color: 'blue',
      path: '/admin/registrations',
    },
    {
      label: '待审批新闻',
      value: pendingArticles,
      icon: FileClock,
      color: 'yellow',
      path: '/admin/articles',
    },
    {
      label: '用户总数',
      value: totalUsers,
      icon: Users,
      color: 'green',
      path: '/admin/users',
    },
    {
      label: '已发布新闻',
      value: publishedArticles,
      icon: Newspaper,
      color: 'blue',
      path: '/admin/articles',
    },
  ];

  const quickActions = [
    {
      label: '审批注册申请',
      icon: UserPlus,
      path: '/admin/registrations',
      variant: 'primary' as const,
    },
    {
      label: '发布新闻',
      icon: FilePlus,
      path: '/admin/articles/create',
      variant: 'primary' as const,
    },
    {
      label: '用户管理',
      icon: Settings,
      path: '/admin/users',
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">管理首页</h1>
        <p className="text-sm text-slate-500 mt-1">
          欢迎回来，{user?.displayName}
        </p>
      </div>

      {error && (
        <div className="retro-panel p-4 bg-red-50 border-red-300 text-red-700">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-ai-section-type="card-list">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="retro-panel p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(card.path)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    card.color === 'blue'
                      ? 'bg-blue-100 text-blue-600'
                      : card.color === 'green'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 快捷操作 */}
      <div className="retro-panel p-5">
        <h2 className="text-lg font-bold text-slate-800 mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3" data-ai-section-type="button">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className={`retro-btn ${action.variant === 'secondary' ? 'retro-btn-secondary' : ''}`}
                onClick={() => navigate(action.path)}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
