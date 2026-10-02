import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import type { NewsArticle, NewsCategory } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [carouselIndex, setCarouselIndex] = useState(0);

  const featuredArticles = articles.slice(0, 3);
  const listArticles = articles.slice(3);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          newsApi.getPublishedArticles({ page, pageSize }),
          newsApi.getCategories(),
        ]);
        setArticles(articlesRes.items);
        setTotal(articlesRes.total);
        setCategories(categoriesRes);
      } catch (err) {
        logger.error('加载首页数据失败', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [page]);

  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredArticles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredArticles.length]);

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/category?slug=${encodeURIComponent(slug)}`);
  };

  const prevSlide = () => {
    setCarouselIndex((prev) =>
      prev === 0 ? featuredArticles.length - 1 : prev - 1,
    );
  };

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % featuredArticles.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="retro-panel px-8 py-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-700 font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="retro-panel px-8 py-6 text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            className="retro-btn"
            onClick={() => setPage(1)}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头条轮播区 */}
      {featuredArticles.length > 0 && (
        <div className="retro-panel overflow-hidden">
          <div className="relative h-80 md:h-96">
            {featuredArticles.map((article: NewsArticle, idx: number) => (
              <div
                key={article.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  idx === carouselIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: article.coverUrl
                      ? `url(${article.coverUrl})`
                      : 'linear-gradient(135deg, #1e3a7a 0%, #2d6ad9 50%, #4a8eff 100%)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  {article.categoryName && (
                    <span className="retro-badge retro-badge-blue mb-3">
                      {article.categoryName}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-lg">
                    {article.title}
                  </h2>
                  {article.summary && (
                    <p className="text-white/80 text-sm md:text-base mb-4 line-clamp-2 max-w-2xl">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {article.viewCount} 浏览
                    </span>
                  </div>
                  <Link to={`/article/${article.id}`} className="retro-btn mt-4">
                    阅读全文
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}

            {featuredArticles.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 retro-btn retro-btn-sm"
                  aria-label="上一张"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 retro-btn retro-btn-sm"
                  aria-label="下一张"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {featuredArticles.map((_: NewsArticle, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === carouselIndex
                          ? 'bg-white w-6'
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`第${idx + 1}张`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 分类快捷入口 */}
      {categories.length > 0 && (
        <div className="retro-panel p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            新闻分类
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat: NewsCategory) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className="retro-btn retro-btn-sm retro-btn-secondary"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 新闻列表 */}
      <div className="retro-panel p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-3">
          <Newspaper className="w-5 h-5 text-blue-600" />
          最新资讯
          <div className="flex-1" />
          <span className="text-sm font-normal text-slate-500">
            共 {total} 篇
          </span>
        </h3>

        {listArticles.length === 0 && articles.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无新闻</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listArticles.length === 0
              ? articles.map((article: NewsArticle) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    formatDate={formatDate}
                  />
                ))
              : listArticles.map((article: NewsArticle) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    formatDate={formatDate}
                  />
                ))}
          </div>
        )}

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
              第 <span className="font-bold text-blue-600">{page}</span> /{' '}
              {totalPages} 页
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
      </div>
    </div>
  );
};

interface ArticleCardProps {
  article: NewsArticle;
  formatDate: (d?: string) => string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, formatDate }) => {
  return (
    <Link
      to={`/article/${article.id}`}
      className="block retro-panel p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex gap-4">
        {article.coverUrl && (
          <div className="flex-shrink-0 w-32 h-24 rounded overflow-hidden bg-slate-100">
            <Image
              src={article.coverUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
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
        </div>
      </div>
    </Link>
  );
};

export default HomePage;
