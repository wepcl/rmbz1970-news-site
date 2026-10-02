import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, ilike, inArray, sql } from 'drizzle-orm';
import { newsArticle, newsCategory, newsUser } from '../../database/schema';
import type {
  NewsArticle,
  NewsCategory,
  ArticleListQuery,
  ArticleListResponse,
  CreateArticleRequest,
  ArticleStatus,
  UserRole,
} from '@shared/api.interface';

@Injectable()
export class NewsService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getCategories(): Promise<NewsCategory[]> {
    const cats = await this.db.select().from(newsCategory).orderBy(newsCategory.sortOrder);
    return cats.map(c => ({ id: c.id, name: c.name, slug: c.slug }));
  }

  async getPublishedArticles(query: ArticleListQuery): Promise<ArticleListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const conditions = [eq(newsArticle.status, 'published')];
    if (query.categoryId) {
      conditions.push(eq(newsArticle.categoryId, query.categoryId));
    }

    const totalResult = await this.db.select({ count: count() }).from(newsArticle).where(and(...conditions));
    const total = Number(totalResult[0].count);

    const articles = await this.db
      .select({
        article: newsArticle,
        categoryName: newsCategory.name,
        authorName: newsUser.displayName,
      })
      .from(newsArticle)
      .leftJoin(newsCategory, eq(newsArticle.categoryId, newsCategory.id))
      .leftJoin(newsUser, eq(newsArticle.authorId, newsUser.id))
      .where(and(...conditions))
      .orderBy(desc(newsArticle.publishedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: articles.map(row => this.mapArticle(row.article, row.categoryName, row.authorName)),
      total,
      page,
      pageSize,
    };
  }

  async getArticleById(id: string): Promise<NewsArticle | null> {
    const rows = await this.db
      .select({
        article: newsArticle,
        categoryName: newsCategory.name,
        authorName: newsUser.displayName,
      })
      .from(newsArticle)
      .leftJoin(newsCategory, eq(newsArticle.categoryId, newsCategory.id))
      .leftJoin(newsUser, eq(newsArticle.authorId, newsUser.id))
      .where(eq(newsArticle.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapArticle(rows[0].article, rows[0].categoryName, rows[0].authorName);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db.update(newsArticle)
      .set({ viewCount: sql<number>`${newsArticle.viewCount} + 1` })
      .where(eq(newsArticle.id, id));
  }

  private mapArticle(
    article: typeof newsArticle.$inferSelect,
    categoryName?: string,
    authorName?: string,
  ): NewsArticle {
    return {
      id: article.id,
      title: article.title,
      summary: article.summary ?? undefined,
      content: article.content,
      coverUrl: article.coverUrl ?? undefined,
      categoryId: article.categoryId,
      categoryName,
      authorId: article.authorId,
      authorName,
      status: article.status as ArticleStatus,
      viewCount: article.viewCount,
      publishedAt: article.publishedAt ? article.publishedAt.toISOString() : undefined,
      createdAt: article.createdAt.toISOString(),
    };
  }

  async createArticle(authorId: string, authorRole: UserRole, dto: CreateArticleRequest): Promise<NewsArticle> {
    const status: ArticleStatus = authorRole === 'creator' ? 'published' : 'pending_approval';
    const publishedAt = authorRole === 'creator' ? new Date() : null;

    const result = await this.db.insert(newsArticle).values({
      title: dto.title,
      summary: dto.summary,
      content: dto.content,
      coverUrl: dto.coverUrl,
      categoryId: dto.categoryId,
      authorId,
      status,
      publishedAt,
    }).returning();

    const article = result[0];
    return this.mapArticle(article);
  }

  async getAdminArticles(
    userId: string,
    userRole: UserRole,
    query: ArticleListQuery,
  ): Promise<ArticleListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.status) {
      conditions.push(eq(newsArticle.status, query.status));
    }

    if (userRole === 'admin' && query.status === 'draft') {
      conditions.push(eq(newsArticle.authorId, userId));
    }

    if (query.categoryId) {
      conditions.push(eq(newsArticle.categoryId, query.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db.select({ count: count() }).from(newsArticle).where(whereClause);
    const total = Number(totalResult[0].count);

    const articles = await this.db
      .select({
        article: newsArticle,
        categoryName: newsCategory.name,
        authorName: newsUser.displayName,
      })
      .from(newsArticle)
      .leftJoin(newsCategory, eq(newsArticle.categoryId, newsCategory.id))
      .leftJoin(newsUser, eq(newsArticle.authorId, newsUser.id))
      .where(whereClause)
      .orderBy(desc(newsArticle.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: articles.map(row => this.mapArticle(row.article, row.categoryName, row.authorName)),
      total,
      page,
      pageSize,
    };
  }
}
