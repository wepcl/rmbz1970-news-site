import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Ban,
  UserX,
  Edit3,
  Trash2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import { useAuth } from '@client/src/contexts/AuthContext';
import type {
  NewsUser,
  UserStatus,
  UserRole,
} from '@shared/api.interface';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';

const statusLabelMap: Record<UserStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  banned: '已封禁',
  rejected: '已拒绝',
};

const statusBadgeMap: Record<UserStatus, string> = {
  pending: 'retro-badge-yellow',
  approved: 'retro-badge-green',
  banned: 'retro-badge-red',
  rejected: 'retro-badge-gray',
};

const roleLabelMap: Record<string, string> = {
  admin: '管理员',
  reader: '读者',
  creator: '创建者',
};

const roleBadgeMap: Record<string, string> = {
  admin: 'retro-badge-blue',
  reader: 'retro-badge-green',
  creator: 'retro-badge-yellow',
};

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<NewsUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');

  // Dialog states
  const [banOpen, setBanOpen] = useState<boolean>(false);
  const [banUserId, setBanUserId] = useState<string>('');
  const [banReason, setBanReason] = useState<string>('');
  const [renameOpen, setRenameOpen] = useState<boolean>(false);
  const [renameUserId, setRenameUserId] = useState<string>('');
  const [renameDisplayName, setRenameDisplayName] = useState<string>('');
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteUserId, setDeleteUserId] = useState<string>('');
  const [unbanConfirmId, setUnbanConfirmId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isCreator = user?.role === 'creator';

  const loadList = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const params: { status?: UserStatus; role?: UserRole } = {};
      if (statusFilter !== 'all') params.status = statusFilter as UserStatus;
      if (roleFilter !== 'all') params.role = roleFilter as UserRole;
      const res = await newsApi.getUsers({
        page: 1,
        pageSize: 200,
        ...params,
      });
      setUsers(res.items ?? []);
    } catch (err: unknown) {
      logger.error('加载用户列表失败', err);
      setError('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredUsers = keyword.trim()
    ? users.filter(
        (u: NewsUser) =>
          u.username.toLowerCase().includes(keyword.toLowerCase()) ||
          u.displayName.toLowerCase().includes(keyword.toLowerCase()),
      )
    : users;

  const openBan = (userId: string): void => {
    setBanUserId(userId);
    setBanReason('');
    setBanOpen(true);
  };

  const handleBan = async (): Promise<void> => {
    if (!banReason.trim()) {
      setError('请填写封禁理由');
      return;
    }
    try {
      setSubmitting(true);
      await newsApi.banUser(banUserId, banReason.trim());
      setBanOpen(false);
      await loadList();
    } catch (err: unknown) {
      logger.error('封禁用户失败', err);
      setError('封禁操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnban = async (userId: string): Promise<void> => {
    if (unbanConfirmId !== userId) {
      setUnbanConfirmId(userId);
      return;
    }
    try {
      await newsApi.unbanUser(userId);
      setUnbanConfirmId('');
      await loadList();
    } catch (err: unknown) {
      logger.error('解封用户失败', err);
      setError('解封操作失败');
    }
  };

  const openRename = (u: NewsUser): void => {
    setRenameUserId(u.id);
    setRenameDisplayName(u.displayName);
    setRenameOpen(true);
  };

  const handleRename = async (): Promise<void> => {
    if (!renameDisplayName.trim()) {
      setError('显示名称不能为空');
      return;
    }
    try {
      setSubmitting(true);
      await newsApi.renameUser(renameUserId, renameDisplayName.trim());
      setRenameOpen(false);
      await loadList();
    } catch (err: unknown) {
      logger.error('改名失败', err);
      setError('改名操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (userId: string): void => {
    setDeleteUserId(userId);
    setDeleteOpen(true);
  };

  const handleDelete = async (): Promise<void> => {
    try {
      setSubmitting(true);
      await newsApi.deleteUser(deleteUserId);
      setDeleteOpen(false);
      await loadList();
    } catch (err: unknown) {
      logger.error('删除用户失败', err);
      setError('删除操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const canBan = (targetUser: NewsUser): boolean => {
    if (isCreator) {
      return targetUser.role === 'reader' || targetUser.role === 'admin';
    }
    return targetUser.role === 'reader';
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
          <p className="text-sm text-slate-500 mt-1">共 {users.length} 位用户</p>
        </div>
        <button
          type="button"
          className="retro-btn retro-btn-secondary"
          onClick={() => loadList()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {error && (
        <div className="retro-panel p-3 bg-red-50 border-red-300 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 筛选栏 */}
      <div className="retro-panel p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-slate-600 mb-1">搜索</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="retro-input pl-8"
                placeholder="搜索用户名或显示名"
                value={keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setKeyword(e.target.value)
                }
              />
            </div>
          </div>
          <div className="w-36">
            <label className="block text-xs text-slate-600 mb-1">状态筛选</label>
            <select
              className="retro-input retro-select"
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">全部</option>
              <option value="pending">待审批</option>
              <option value="approved">已通过</option>
              <option value="banned">已封禁</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-slate-600 mb-1">角色筛选</label>
            <select
              className="retro-input retro-select"
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRoleFilter(e.target.value)
              }
            >
              <option value="all">全部</option>
              <option value="creator">创建者</option>
              <option value="admin">管理员</option>
              <option value="reader">读者</option>
            </select>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="retro-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">加载中...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">暂无用户</div>
        ) : (
          <table className="retro-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>显示名称</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: NewsUser) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.username}</td>
                  <td>{u.displayName}</td>
                  <td>
                    <span
                      className={`retro-badge ${roleBadgeMap[u.role] ?? 'retro-badge-gray'}`}
                    >
                      {roleLabelMap[u.role] ?? u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`retro-badge ${statusBadgeMap[u.status] ?? 'retro-badge-gray'}`}
                    >
                      {statusLabelMap[u.status] ?? u.status}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {u.status === 'banned' ? (
                        <button
                          type="button"
                          className={`retro-btn retro-btn-sm ${unbanConfirmId === u.id ? 'retro-btn-danger' : 'retro-btn-secondary'}`}
                          onClick={() => { void handleUnban(u.id); }}
                        >
                          <UserX className="w-3 h-3" />
                          {unbanConfirmId === u.id ? '确认解封?' : '解封'}
                        </button>
                      ) : canBan(u) && u.status === 'approved' ? (
                        <button
                          type="button"
                          className="retro-btn retro-btn-sm retro-btn-danger"
                          onClick={() => openBan(u.id)}
                        >
                          <Ban className="w-3 h-3" />
                          封禁
                        </button>
                      ) : null}
                      {isCreator && (
                        <>
                          <button
                            type="button"
                            className="retro-btn retro-btn-sm retro-btn-secondary"
                            onClick={() => openRename(u)}
                          >
                            <Edit3 className="w-3 h-3" />
                            改名
                          </button>
                          <button
                            type="button"
                            className="retro-btn retro-btn-sm retro-btn-danger"
                            onClick={() => openDelete(u.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 封禁弹窗 */}
      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              封禁用户
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              请填写封禁理由。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              封禁理由
            </label>
            <textarea
              className="retro-input min-h-[100px] resize-y"
              value={banReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBanReason(e.target.value)
              }
              placeholder="请输入封禁理由..."
            />
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className="retro-btn retro-btn-secondary"
              onClick={() => setBanOpen(false)}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="button"
              className="retro-btn retro-btn-danger"
              onClick={() => { void handleBan(); }}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认封禁'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 改名弹窗 */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              修改显示名称
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              新显示名称
            </label>
            <input
              type="text"
              className="retro-input"
              value={renameDisplayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRenameDisplayName(e.target.value)
              }
              placeholder="请输入新的显示名称"
            />
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className="retro-btn retro-btn-secondary"
              onClick={() => setRenameOpen(false)}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="button"
              className="retro-btn"
              onClick={() => { void handleRename(); }}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认修改'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600">
            确定要删除该用户吗？此操作不可撤销。
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className="retro-btn retro-btn-secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="button"
              className="retro-btn retro-btn-danger"
              onClick={() => { void handleDelete(); }}
              disabled={submitting}
            >
              {submitting ? '删除中...' : '确认删除'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
