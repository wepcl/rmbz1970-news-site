import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import { useAuth } from '@client/src/contexts/AuthContext';
import type { NewsCategory, CreateArticleRequest } from '@shared/api.interface';

const AdminCreateArticle: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    const loadCategories = async (): Promise<void> => {
      try {
        const cats = await newsApi.getCategories();
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      } catch (err: unknown) {
        logger.error('加载分类失败', err);
        setError('加载分类失败');
      } finally {
        setLoading(false);
      }
    };
    void loadCategories();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    if (!categoryId) {
      setError('请选择分类');
      return;
    }
    if (!content.trim()) {
      setError('请输入正文内容');
      return;
    }

    const data: CreateArticleRequest = {
      title: title.trim(),
      summary: summary.trim() || undefined,
      content: content.trim(),
      coverUrl: coverUrl.trim() || undefined,
      categoryId,
    };

    try {
      setSubmitting(true);
      await newsApi.createArticle(data);
      setSuccess(true);
    } catch (err: unknown) {
      logger.error('创建新闻失败', err);
      setError('创建新闻失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const isCreator = user?.role === 'creator';

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="retro-panel p-8 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">发布成功</h1>
          <p className="text-slate-600 mb-6">
            {isCreator
              ? '新闻已直接发布到前台。'
              : '新闻已提交，等待创建者审批后发布。'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="retro-btn retro-btn-secondary"
              onClick={() => navigate('/admin/articles')}
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
            <button
              type="button"
              className="retro-btn"
              onClick={() => {
                setSuccess(false);
                setTitle('');
                setSummary('');
                setCoverUrl('');
                setContent('');
              }}
            >
              继续发布
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="retro-btn retro-btn-secondary retro-btn-sm"
          onClick={() => navigate('/admin/articles')}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <h1 className="text-2xl font-bold text-slate-800">发布新闻</h1>
      </div>

      {error && (
        <div className="retro-panel p-3 bg-red-50 border-red-300 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={(e) => { void handleSubmit(e); }} className="retro-panel p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="retro-input"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            placeholder="请输入新闻标题"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            摘要
          </label>
          <textarea
            className="retro-input min-h-[80px] resize-y"
            value={summary}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSummary(e.target.value)
            }
            placeholder="请输入新闻摘要（可选）"
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            分类 <span className="text-red-500">*</span>
          </label>
          {loading ? (
            <div className="retro-input text-slate-400">加载中...</div>
          ) : (
            <select
              className="retro-input retro-select"
              value={categoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategoryId(e.target.value)
              }
            >
              {categories.map((c: NewsCategory) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            封面图 URL
          </label>
          <input
            type="text"
            className="retro-input"
            value={coverUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCoverUrl(e.target.value)
            }
            placeholder="请输入封面图地址（可选）"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            正文内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            className="retro-input min-h-[300px] resize-y font-mono text-sm"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setContent(e.target.value)
            }
            placeholder="请输入新闻正文内容..."
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            className="retro-btn retro-btn-secondary"
            onClick={() => navigate('/admin/articles')}
          >
            取消
          </button>
          <button
            type="submit"
            className="retro-btn"
            disabled={submitting || loading}
          >
            <Send className="w-4 h-4" />
            {submitting ? '提交中...' : isCreator ? '立即发布' : '提交审批'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateArticle;
