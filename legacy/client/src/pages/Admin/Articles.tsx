import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Check,
  X,
  Trash2,
  AlertCircle,
  Eye,
  ArrowDownCircle,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import { useAuth } from '@client/src/contexts/AuthContext';
import type { NewsArticle, ArticleStatus } from '@shared/api.interface';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';

const statusLabelMap: Record<ArticleStatus, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  published: '已发布',
  rejected: '已拒绝',
  offline: '已下架',
};

const statusBadgeMap: Record<ArticleStatus, string> = {
  draft: 'retro-badge-gray',
  pending_approval: 'retro-badge-yellow',
  published: 'retro-badge-green',
  rejected: 'retro-badge-red',
  offline: 'retro-badge-gray',
};

const AdminArticles: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [rejectOpen, setRejectOpen] = useState<boolean>(false);
  const [rejectArticleId, setRejectArticleId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string>('');
  const [offlineConfirmId, setOfflineConfirmId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isCreator = user?.role === 'creator';

  const loadList = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const params: { page: number; pageSize: number; status?: ArticleStatus } = {
        page: 1,
        pageSize: 200,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter as ArticleStatus;
      }
      const res = await newsApi.getAdminArticles(params);
      setArticles(res.items ?? []);
    } catch (err: unknown) {
      logger.error('加载新闻列表失败', err);
      setError('加载新闻列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredArticles = articles;

  const handleApprove = async (articleId: string): Promise<void> => {
    try {
      await newsApi.approveArticle(articleId);
      await loadList();
    } catch (err: unknown) {
      logger.error('批准新闻失败', err);
      setError('批准操作失败');
    }
  };

  const openReject = (articleId: string): void => {
    setRejectArticleId(articleId);
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
      await newsApi.rejectArticle(rejectArticleId);
      setRejectOpen(false);
      await loadList();
    } catch (err: unknown) {
      logger.error('拒绝新闻失败', err);
      setError('拒绝操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOffline = async (articleId: string): Promise<void> => {
    if (offlineConfirmId !== articleId) {
      setOfflineConfirmId(articleId);
      return;
    }
    try {
      await newsApi.offlineArticle(articleId);
      setOfflineConfirmId('');
      await loadList();
    } catch (err: unknown) {
      logger.error('下架新闻失败', err);
      setError('下架操作失败');
    }
  };

  const openDelete = (articleId: string): void => {
    setDeleteArticleId(articleId);
    setDeleteOpen(true);
  };

  const handleDelete = async (): Promise<void> => {
    try {
      setSubmitting(true);
      await newsApi.deleteArticle(deleteArticleId);
      setDeleteOpen(false);
      await loadList();
    } catch (err: unknown) {
      logger.error('删除新闻失败', err);
      setError('删除操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const showApprovalActions = (article: NewsArticle): boolean => {
    return article.status === 'pending_approval' && isCreator;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">新闻管理</h1>
          <p className="text-sm text-slate-500 mt-1">共 {articles.length} 篇</p>
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

      {/* 筛选 */}
      <div className="retro-panel p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="block text-xs text-slate-600 mb-1">状态筛选</label>
            <select
              className="retro-input retro-select"
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">全部</option>
              <option value="pending_approval">待审批</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="rejected">已拒绝</option>
              <option value="offline">已下架</option>
            </select>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="retro-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">加载中...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-slate-500">暂无新闻</div>
        ) : (
          <table className="retro-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>作者</th>
                <th>状态</th>
                <th>发布时间</th>
                <th className="text-right">浏览量</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((a: NewsArticle) => (
                <tr key={a.id}>
                  <td className="font-medium max-w-[240px] truncate" title={a.title}>
                    {a.title}
                  </td>
                  <td>{a.categoryName || '-'}</td>
                  <td>{a.authorName || '-'}</td>
                  <td>
                    <span
                      className={`retro-badge ${statusBadgeMap[a.status] ?? 'retro-badge-gray'}`}
                    >
                      {statusLabelMap[a.status] ?? a.status}
                    </span>
                  </td>
                  <td>{formatDate(a.publishedAt ?? a.createdAt)}</td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Eye className="w-3 h-3" />
                      {a.viewCount}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {showApprovalActions(a) && (
                        <>
                          <button
                            type="button"
                            className="retro-btn retro-btn-sm"
                            onClick={() => handleApprove(a.id)}
                          >
                            <Check className="w-3 h-3" />
                            批准
                          </button>
                          <button
                            type="button"
                            className="retro-btn retro-btn-sm retro-btn-danger"
                            onClick={() => openReject(a.id)}
                          >
                            <X className="w-3 h-3" />
                            拒绝
                          </button>
                        </>
                      )}
                      {a.status === 'published' && isCreator && (
                        <button
                          type="button"
                          className={`retro-btn retro-btn-sm ${offlineConfirmId === a.id ? 'retro-btn-danger' : 'retro-btn-secondary'}`}
                          onClick={() => handleOffline(a.id)}
                        >
                          <ArrowDownCircle className="w-3 h-3" />
                          {offlineConfirmId === a.id ? '确认下架?' : '下架'}
                        </button>
                      )}
                      {isCreator && (
                        <button
                          type="button"
                          className="retro-btn retro-btn-sm retro-btn-danger"
                          onClick={() => openDelete(a.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 拒绝弹窗 */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              拒绝新闻
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              请填写拒绝理由。
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

      {/* 删除确认 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600">
            确定要删除这篇新闻吗？此操作不可撤销。
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

export default AdminArticles;
