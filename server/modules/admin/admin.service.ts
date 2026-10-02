import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, or } from 'drizzle-orm';
import { newsUser, newsArticle } from '../../database/schema';
import type {
  UserListQuery,
  UserListResponse,
  NewsUser,
  UserRole,
  UserStatus,
  ArticleStatus,
  ArticleListResponse,
  ArticleListQuery,
  NewsArticle,
  NewsCategory,
} from '@shared/api.interface';
import { newsCategory } from '../../database/schema';

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private ensureAdmin(role: UserRole): void {
    if (role !== 'creator' && role !== 'admin') {
      throw new ForbiddenException('无管理权限');
    }
  }

  private ensureCreator(role: UserRole): void {
    if (role !== 'creator') {
      throw new ForbiddenException('仅创建者可执行此操作');
    }
  }

  async getPendingRegistrations(operatorRole: UserRole, query: UserListQuery): Promise<UserListResponse> {
    this.ensureAdmin(operatorRole);
    return this.getUserList(operatorRole, { ...query, status: 'pending' });
  }

  async getUserList(operatorRole: UserRole, query: UserListQuery): Promise<UserListResponse> {
    this.ensureAdmin(operatorRole);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.status) conditions.push(eq(newsUser.status, query.status));
    if (query.role) conditions.push(eq(newsUser.role, query.role));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db.select({ count: count() }).from(newsUser).where(whereClause);
    const total = Number(totalResult[0].count);

    const users = await this.db
      .select()
      .from(newsUser)
      .where(whereClause)
      .orderBy(desc(newsUser.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: users.map(u => this.mapUser(u)),
      total,
      page,
      pageSize,
    };
  }

  private mapUser(u: typeof newsUser.$inferSelect): NewsUser {
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role as UserRole,
      status: u.status as UserStatus,
      banReason: u.banReason ?? undefined,
      createdAt: u.createdAt.toISOString(),
    };
  }

  async approveRegistration(operatorId: string, operatorRole: UserRole, userId: string): Promise<NewsUser> {
    this.ensureAdmin(operatorRole);

    const user = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (user.length === 0) throw new NotFoundException('用户不存在');
    if (user[0].status !== 'pending') throw new BadRequestException('该用户状态不是待审批');

    if (operatorRole === 'admin' && user[0].role === 'admin') {
      throw new ForbiddenException('管理员不能批准其他管理员注册');
    }

    const result = await this.db.update(newsUser)
      .set({ status: 'approved', approvedBy: operatorId, approvedAt: new Date() })
      .where(eq(newsUser.id, userId))
      .returning();

    return this.mapUser(result[0]);
  }

  async rejectRegistration(operatorRole: UserRole, userId: string, reason: string): Promise<NewsUser> {
    this.ensureAdmin(operatorRole);

    const user = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (user.length === 0) throw new NotFoundException('用户不存在');
    if (user[0].status !== 'pending') throw new BadRequestException('该用户状态不是待审批');

    if (operatorRole === 'admin' && user[0].role === 'admin') {
      throw new ForbiddenException('管理员不能拒绝其他管理员注册');
    }

    const result = await this.db.update(newsUser)
      .set({ status: 'rejected', banReason: reason })
      .where(eq(newsUser.id, userId))
      .returning();

    return this.mapUser(result[0]);
  }

  async banUser(operatorRole: UserRole, userId: string, reason: string): Promise<NewsUser> {
    const user = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (user.length === 0) throw new NotFoundException('用户不存在');

    if (user[0].role === 'creator') {
      throw new ForbiddenException('不能封禁创建者');
    }

    if (operatorRole === 'admin') {
      if (user[0].role === 'admin') {
        throw new ForbiddenException('管理员不能封禁其他管理员');
      }
    } else if (operatorRole !== 'creator') {
      throw new ForbiddenException('无封禁权限');
    }

    const result = await this.db.update(newsUser)
      .set({ status: 'banned', banReason: reason })
      .where(eq(newsUser.id, userId))
      .returning();

    return this.mapUser(result[0]);
  }

  async unbanUser(operatorRole: UserRole, userId: string): Promise<NewsUser> {
    this.ensureAdmin(operatorRole);

    const user = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (user.length === 0) throw new NotFoundException('用户不存在');
    if (user[0].status !== 'banned') throw new BadRequestException('该用户未被封禁');

    if (operatorRole === 'admin' && user[0].role === 'admin') {
      throw new ForbiddenException('管理员不能解封其他管理员');
    }

    const result = await this.db.update(newsUser)
      .set({ status: 'approved', banReason: null })
      .where(eq(newsUser.id, userId))
      .returning();

    return this.mapUser(result[0]);
  }

  async renameUser(operatorRole: UserRole, userId: string, displayName: string): Promise<NewsUser> {
    this.ensureCreator(operatorRole);

    const user = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (user.length === 0) throw new NotFoundException('用户不存在');

    const result = await this.db.update(newsUser)
      .set({ displayName })
      .where(eq(newsUser.id, userId))
      .returning();

    return this.mapUser(result[0]);
  }

  async deleteUser(operatorRole: UserRole, userId: string): Promise<void> {
    this.ensureCreator(operatorRole);

    const user = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (user.length === 0) throw new NotFoundException('用户不存在');
    if (user[0].role === 'creator') {
      throw new BadRequestException('不能删除创建者');
    }

    await this.db.update(newsArticle)
      .set({ authorId: (await this.db.select({ id: newsUser.id }).from(newsUser).where(eq(newsUser.username, 'creator')).limit(1))[0].id })
      .where(eq(newsArticle.authorId, userId));

    await this.db.delete(newsUser).where(eq(newsUser.id, userId));
  }

  async getArticlesForApproval(operatorRole: UserRole, query: ArticleListQuery): Promise<ArticleListResponse> {
    this.ensureAdmin(operatorRole);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const status = operatorRole === 'creator' ? 'pending_approval' : 'draft';

    const conditions = [eq(newsArticle.status, status)];
    if (query.categoryId) {
      conditions.push(eq(newsArticle.categoryId, query.categoryId));
    }

    const whereClause = and(...conditions);

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
      items: articles.map(row => ({
        id: row.article.id,
        title: row.article.title,
        summary: row.article.summary ?? undefined,
        content: row.article.content,
        coverUrl: row.article.coverUrl ?? undefined,
        categoryId: row.article.categoryId,
        categoryName: row.categoryName,
        authorId: row.article.authorId,
        authorName: row.authorName,
        status: row.article.status as ArticleStatus,
        viewCount: row.article.viewCount,
        publishedAt: row.article.publishedAt ? row.article.publishedAt.toISOString() : undefined,
        createdAt: row.article.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async getAllArticles(operatorRole: UserRole, query: ArticleListQuery): Promise<ArticleListResponse> {
    this.ensureAdmin(operatorRole);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.status) {
      conditions.push(eq(newsArticle.status, query.status));
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
      items: articles.map(row => ({
        id: row.article.id,
        title: row.article.title,
        summary: row.article.summary ?? undefined,
        content: row.article.content,
        coverUrl: row.article.coverUrl ?? undefined,
        categoryId: row.article.categoryId,
        categoryName: row.categoryName,
        authorId: row.article.authorId,
        authorName: row.authorName,
        status: row.article.status as ArticleStatus,
        viewCount: row.article.viewCount,
        publishedAt: row.article.publishedAt ? row.article.publishedAt.toISOString() : undefined,
        createdAt: row.article.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async approveArticle(operatorRole: UserRole, articleId: string): Promise<NewsArticle> {
    this.ensureCreator(operatorRole);

    const article = await this.db.select().from(newsArticle).where(eq(newsArticle.id, articleId)).limit(1);
    if (article.length === 0) throw new NotFoundException('文章不存在');
    if (article[0].status !== 'pending_approval') {
      throw new BadRequestException('该文章状态不是待审批');
    }

    const result = await this.db.update(newsArticle)
      .set({
        status: 'published',
        approvedBy: (await this.db.select({ id: newsUser.id }).from(newsUser).where(eq(newsUser.role, 'creator')).limit(1))[0].id,
        approvedAt: new Date(),
        publishedAt: new Date(),
      })
      .where(eq(newsArticle.id, articleId))
      .returning();

    const row = result[0];
    const cat = await this.db.select({ name: newsCategory.name }).from(newsCategory).where(eq(newsCategory.id, row.categoryId)).limit(1);
    const author = await this.db.select({ name: newsUser.displayName }).from(newsUser).where(eq(newsUser.id, row.authorId)).limit(1);

    return {
      id: row.id,
      title: row.title,
      summary: row.summary ?? undefined,
      content: row.content,
      coverUrl: row.coverUrl ?? undefined,
      categoryId: row.categoryId,
      categoryName: cat[0]?.name,
      authorId: row.authorId,
      authorName: author[0]?.name,
      status: row.status as ArticleStatus,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async rejectArticle(operatorRole: UserRole, articleId: string): Promise<NewsArticle> {
    this.ensureCreator(operatorRole);

    const article = await this.db.select().from(newsArticle).where(eq(newsArticle.id, articleId)).limit(1);
    if (article.length === 0) throw new NotFoundException('文章不存在');

    const result = await this.db.update(newsArticle)
      .set({ status: 'rejected' })
      .where(eq(newsArticle.id, articleId))
      .returning();

    const row = result[0];
    const cat = await this.db.select({ name: newsCategory.name }).from(newsCategory).where(eq(newsCategory.id, row.categoryId)).limit(1);
    const author = await this.db.select({ name: newsUser.displayName }).from(newsUser).where(eq(newsUser.id, row.authorId)).limit(1);

    return {
      id: row.id,
      title: row.title,
      summary: row.summary ?? undefined,
      content: row.content,
      coverUrl: row.coverUrl ?? undefined,
      categoryId: row.categoryId,
      categoryName: cat[0]?.name,
      authorId: row.authorId,
      authorName: author[0]?.name,
      status: row.status as ArticleStatus,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async offlineArticle(operatorRole: UserRole, articleId: string): Promise<NewsArticle> {
    this.ensureCreator(operatorRole);

    const article = await this.db.select().from(newsArticle).where(eq(newsArticle.id, articleId)).limit(1);
    if (article.length === 0) throw new NotFoundException('文章不存在');

    const result = await this.db.update(newsArticle)
      .set({ status: 'offline' })
      .where(eq(newsArticle.id, articleId))
      .returning();

    const row = result[0];
    const cat = await this.db.select({ name: newsCategory.name }).from(newsCategory).where(eq(newsCategory.id, row.categoryId)).limit(1);
    const author = await this.db.select({ name: newsUser.displayName }).from(newsUser).where(eq(newsUser.id, row.authorId)).limit(1);

    return {
      id: row.id,
      title: row.title,
      summary: row.summary ?? undefined,
      content: row.content,
      coverUrl: row.coverUrl ?? undefined,
      categoryId: row.categoryId,
      categoryName: cat[0]?.name,
      authorId: row.authorId,
      authorName: author[0]?.name,
      status: row.status as ArticleStatus,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteArticle(operatorRole: UserRole, articleId: string): Promise<void> {
    this.ensureCreator(operatorRole);

    const article = await this.db.select().from(newsArticle).where(eq(newsArticle.id, articleId)).limit(1);
    if (article.length === 0) throw new NotFoundException('文章不存在');

    await this.db.delete(newsArticle).where(eq(newsArticle.id, articleId));
  }
}
