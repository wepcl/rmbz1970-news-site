import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Clock,
  User,
  Tag,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import type { NewsArticle } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await newsApi.getArticle(id);
        setArticle(data);
      } catch (err) {
        logger.error('加载文章失败', err);
        setError('文章加载失败或不存在');
      } finally {
        setLoading(false);
      }
    };
    void loadArticle();
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="retro-panel px-8 py-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-slate-700 font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="retro-panel px-8 py-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-4">
            {error || '文章不存在'}
          </p>
          <button className="retro-btn" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={handleBack}
        className="retro-btn retro-btn-sm retro-btn-secondary mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <article className="retro-panel p-6 md:p-8">
        {/* 标题区 */}
        <header className="mb-6 pb-6 border-b border-blue-200">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {article.categoryName && (
              <span className="retro-badge retro-badge-blue flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {article.categoryName}
              </span>
            )}
            {article.authorName && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {article.authorName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.viewCount} 次浏览
            </span>
          </div>
        </header>

        {/* 封面图 */}
        {article.coverUrl && (
          <div className="mb-6 rounded overflow-hidden border border-blue-200">
            <Image
              src={article.coverUrl}
              alt={article.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {/* 摘要 */}
        {article.summary && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <p className="text-slate-700 italic">{article.summary}</p>
          </div>
        )}

        {/* 正文 */}
        <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:rounded-r prose-img:rounded-lg prose-img:border prose-img:border-slate-200">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </article>

      {/* 底部返回 */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleBack}
          className="retro-btn retro-btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          返回上一页
        </button>
      </div>
    </div>
  );
};

export default ArticlePage;
