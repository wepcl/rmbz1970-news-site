import { Controller, Get, Query, Param, Post, Body, Req, UnauthorizedException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { NewsService } from './news.service';
import { AuthService } from '../auth/auth.service';
import type {
  NewsArticle,
  NewsCategory,
  ArticleListQuery,
  ArticleListResponse,
  CreateArticleRequest,
  UserRole,
} from '@shared/api.interface';

@Controller('api/news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly authService: AuthService,
  ) {}

  @Get('categories')
  async getCategories(): Promise<NewsCategory[]> {
    return this.newsService.getCategories();
  }

  @Get('articles')
  async getPublishedArticles(@Query() query: ArticleListQuery): Promise<ArticleListResponse> {
    return this.newsService.getPublishedArticles(query);
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string): Promise<NewsArticle> {
    const article = await this.newsService.getArticleById(id);
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    await this.newsService.incrementViewCount(id);
    return article;
  }

  private getCurrentUser(req: Request): { userId: string; userRole: UserRole } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const userId = this.authService.verifyToken(token);
    if (!userId) return null;
    return { userId, userRole: 'reader' };
  }

  @Post('articles')
  async createArticle(
    @Req() req: Request,
    @Body() dto: CreateArticleRequest,
  ): Promise<NewsArticle> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录');
    }
    const token = authHeader.slice(7);
    const userId = this.authService.verifyToken(token);
    if (!userId) {
      throw new UnauthorizedException('登录已过期');
    }
    const user = await this.authService.getUserById(userId);
    if (!user || user.status !== 'approved') {
      throw new UnauthorizedException('账号不可用');
    }
    if (user.role !== 'creator' && user.role !== 'admin') {
      throw new UnauthorizedException('无权限创建新闻');
    }
    return this.newsService.createArticle(userId, user.role, dto);
  }
}
