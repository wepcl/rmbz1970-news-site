import { Controller, Get, Post, Body, Param, Query, Req, UnauthorizedException, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import type {
  UserListQuery,
  UserListResponse,
  NewsUser,
  ArticleListQuery,
  ArticleListResponse,
  NewsArticle,
  UserRole,
} from '@shared/api.interface';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  private async getOperator(req: Request): Promise<{ userId: string; userRole: UserRole }> {
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
    return { userId, userRole: user.role };
  }

  @Get('registrations/pending')
  async getPendingRegistrations(
    @Req() req: Request,
    @Query() query: UserListQuery,
  ): Promise<UserListResponse> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.getPendingRegistrations(userRole, query);
  }

  @Post('registrations/:userId/approve')
  @HttpCode(HttpStatus.OK)
  async approveRegistration(
    @Req() req: Request,
    @Param('userId') userId: string,
  ): Promise<NewsUser> {
    const { userId: operatorId, userRole } = await this.getOperator(req);
    return this.adminService.approveRegistration(operatorId, userRole, userId);
  }

  @Post('registrations/:userId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRegistration(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ): Promise<NewsUser> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.rejectRegistration(userRole, userId, body.reason || '注册申请未通过');
  }

  @Get('users')
  async getUsers(
    @Req() req: Request,
    @Query() query: UserListQuery,
  ): Promise<UserListResponse> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.getUserList(userRole, query);
  }

  @Post('users/:userId/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ): Promise<NewsUser> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.banUser(userRole, userId, body.reason || '违反网站规定');
  }

  @Post('users/:userId/unban')
  @HttpCode(HttpStatus.OK)
  async unbanUser(
    @Req() req: Request,
    @Param('userId') userId: string,
  ): Promise<NewsUser> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.unbanUser(userRole, userId);
  }

  @Post('users/:userId/rename')
  @HttpCode(HttpStatus.OK)
  async renameUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() body: { displayName: string },
  ): Promise<NewsUser> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.renameUser(userRole, userId, body.displayName);
  }

  @Delete('users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Req() req: Request,
    @Param('userId') userId: string,
  ): Promise<void> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.deleteUser(userRole, userId);
  }

  @Get('articles')
  async getAllArticles(
    @Req() req: Request,
    @Query() query: ArticleListQuery,
  ): Promise<ArticleListResponse> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.getAllArticles(userRole, query);
  }

  @Get('articles/pending-approval')
  async getPendingApprovalArticles(
    @Req() req: Request,
    @Query() query: ArticleListQuery,
  ): Promise<ArticleListResponse> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.getArticlesForApproval(userRole, query);
  }

  @Post('articles/:articleId/approve')
  @HttpCode(HttpStatus.OK)
  async approveArticle(
    @Req() req: Request,
    @Param('articleId') articleId: string,
  ): Promise<NewsArticle> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.approveArticle(userRole, articleId);
  }

  @Post('articles/:articleId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectArticle(
    @Req() req: Request,
    @Param('articleId') articleId: string,
  ): Promise<NewsArticle> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.rejectArticle(userRole, articleId);
  }

  @Post('articles/:articleId/offline')
  @HttpCode(HttpStatus.OK)
  async offlineArticle(
    @Req() req: Request,
    @Param('articleId') articleId: string,
  ): Promise<NewsArticle> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.offlineArticle(userRole, articleId);
  }

  @Delete('articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArticle(
    @Req() req: Request,
    @Param('articleId') articleId: string,
  ): Promise<void> {
    const { userRole } = await this.getOperator(req);
    return this.adminService.deleteArticle(userRole, articleId);
  }
}
