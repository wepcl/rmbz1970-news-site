import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  List,
  Newspaper,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import type { NewsArticle, NewsCategory } from '@shared/api.interface';

const CategoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const slug = searchParams.get('slug') || '';

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const currentCategory = useMemo(
    () => categories.find((c: NewsCategory) => c.slug === slug) || null,
    [categories, slug],
  );

  const categoryId = currentCategory?.id || '';

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await newsApi.getCategories();
        setCategories(data);
      } catch (err) {
        logger.error('加载分类失败', err);
      }
    };
    void loadCategories();
  }, []);

  // 加载新闻列表
  useEffect(() => {
    if (categories.length === 0) return; // 等分类加载完再判定

    const loadArticles = async () => {
      setArticlesLoading(true);
      setError(null);
      try {
        const params: { page: number; pageSize: number; categoryId?: string } = {
          page,
          pageSize,
        };
        if (categoryId) params.categoryId = categoryId;
        const res = await newsApi.getPublishedArticles(params);
        setArticles(res.items);
        setTotal(res.total);
      } catch (err) {
        logger.error('加载分类新闻失败', err);
        setError('加载失败，请稍后重试');
      } finally {
        setArticlesLoading(false);
        setLoading(false);
      }
    };
    void loadArticles();
  }, [categoryId, page, categories.length]);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleCategoryClick = (catSlug: string) => {
    setSearchParams({ slug: catSlug });
    navigate(`/category?slug=${encodeURIComponent(catSlug)}`);
  };

  const handleAllClick = () => {
    setSearchParams({});
    navigate('/category');
  };

  return (
    <div className="flex flex-row gap-6 flex-wrap">
      {/* 左侧分类导航 */}
      <aside className="w-56 flex-shrink-0">
        <div className="retro-panel p-4">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-blue-200 pb-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            新闻分类
          </h3>
          <nav className="space-y-1">
            <button
              onClick={handleAllClick}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                !slug
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-slate-700 hover:bg-blue-50'
              }`}
            >
              <List className="w-4 h-4" />
              全部新闻
            </button>
            {categories.map((cat: NewsCategory) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  cat.slug === slug
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 右侧新闻列表 */}
      <main className="flex-1 min-w-0">
        <div className="retro-panel p-5">
          <div className="flex items-center gap-2 border-b border-blue-200 pb-3 mb-4">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {currentCategory ? currentCategory.name : '全部新闻'}
            </h2>
            <div className="flex-1" />
            <span className="text-sm text-slate-500">
              共 {total} 篇文章
            </span>
          </div>

          {articlesLoading && articles.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button className="retro-btn" onClick={() => setPage(1)}>
                重试
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>该分类下暂无新闻</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {articles.map((article: NewsArticle) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.id}`}
                    className="block retro-panel p-4 hover:shadow-md transition-shadow group"
                  >
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">
                      {article.title}
                    </h4>
                    {article.summary && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {article.categoryName && (
                        <span className="retro-badge retro-badge-blue">
                          {article.categoryName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(article.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.viewCount}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-blue-100">
                  <button
                    className="retro-btn retro-btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </button>
                  <span className="text-sm text-slate-600 px-3">
                    第 <span className="font-bold text-blue-600">{page}</span>{' '}
                    / {totalPages} 页
                  </span>
                  <button
                    className="retro-btn retro-btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CategoryPage;
