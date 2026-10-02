import React, { useState, useEffect } from 'react';
import { Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import type { NewsUser } from '@shared/api.interface';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';

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

const AdminRegistrations: React.FC = () => {
  const [users, setUsers] = useState<NewsUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [rejectOpen, setRejectOpen] = useState<boolean>(false);
  const [rejectUserId, setRejectUserId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadList = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const res = await newsApi.getPendingRegistrations({
        page: 1,
        pageSize: 100,
      });
      setUsers(res.items ?? []);
    } catch (err: unknown) {
      logger.error('加载待审批注册列表失败', err);
      setError('加载列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, []);

  const handleApprove = async (userId: string): Promise<void> => {
    try {
      await newsApi.approveRegistration(userId);
      setUsers((prev) => prev.filter((u: NewsUser) => u.id !== userId));
    } catch (err: unknown) {
      logger.error('批准注册失败', err);
      setError('批准操作失败');
    }
  };

  const openReject = (userId: string): void => {
    setRejectUserId(userId);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleReject = async (): Promise<void> => {
    if (!rejectReason.trim()) {
      setError('请填写拒绝理由');
      return;
    }
    try {
      setSubmitting(true);
      await newsApi.rejectRegistration(rejectUserId, rejectReason.trim());
      setUsers((prev) => prev.filter((u: NewsUser) => u.id !== rejectUserId));
      setRejectOpen(false);
    } catch (err: unknown) {
      logger.error('拒绝注册失败', err);
      setError('拒绝操作失败');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-800">注册审批</h1>
          <p className="text-sm text-slate-500 mt-1">
            待审批用户：{users.length} 人
          </p>
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

      <div className="retro-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">加载中...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            暂无待审批注册申请
          </div>
        ) : (
          <table className="retro-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>显示名称</th>
                <th>申请角色</th>
                <th>申请时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: NewsUser) => (
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
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="retro-btn retro-btn-sm"
                        onClick={() => handleApprove(u.id)}
                      >
                        <Check className="w-3 h-3" />
                        批准
                      </button>
                      <button
                        type="button"
                        className="retro-btn retro-btn-sm retro-btn-danger"
                        onClick={() => openReject(u.id)}
                      >
                        <X className="w-3 h-3" />
                        拒绝
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 拒绝理由弹窗 */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              拒绝注册申请
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              请填写拒绝理由，该理由将通知申请人。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              拒绝理由
            </label>
            <textarea
              className="retro-input min-h-[100px] resize-y"
              value={rejectReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRejectReason(e.target.value)
              }
              placeholder="请输入拒绝理由..."
            />
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className="retro-btn retro-btn-secondary"
              onClick={() => setRejectOpen(false)}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="button"
              className="retro-btn retro-btn-danger"
              onClick={() => { void handleReject(); }}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认拒绝'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRegistrations;
