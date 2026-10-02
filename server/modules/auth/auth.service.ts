import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import { newsUser } from '../../database/schema';
import type { LoginRequest, RegisterRequest, LoginResponse, NewsUser, UserStatus } from '@shared/api.interface';

@Injectable()
export class AuthService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split('.');
    if (!salt || !hash) return false;
    const computedHash = this.hashPassword(password, salt);
    return computedHash === hash;
  }

  private generateToken(userId: string): string {
    const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64');
    const signature = crypto.createHmac('sha256', 'news-site-secret-key').update(payload).digest('hex');
    return `${payload}.${signature}`;
  }

  verifyToken(token: string): string | null {
    try {
      const [payload, signature] = token.split('.');
      if (!payload || !signature) return null;
      const expectedSig = crypto.createHmac('sha256', 'news-site-secret-key').update(payload).digest('hex');
      if (expectedSig !== signature) return null;
      const data = JSON.parse(Buffer.from(payload, 'base64').toString());
      return data.userId;
    } catch {
      return null;
    }
  }

  async register(dto: RegisterRequest): Promise<{ id: string; username: string; status: UserStatus }> {
    const existing = await this.db.select().from(newsUser).where(eq(newsUser.username, dto.username)).limit(1);
    if (existing.length > 0) {
      throw new BadRequestException('用户名已存在');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = salt + '.' + this.hashPassword(dto.password, salt);

    const result = await this.db.insert(newsUser).values({
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
      role: dto.role,
      status: 'pending',
    }).returning({ id: newsUser.id, username: newsUser.username, status: newsUser.status });

    return { id: result[0].id, username: result[0].username, status: result[0].status as UserStatus };
  }

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const users = await this.db.select().from(newsUser).where(eq(newsUser.username, dto.username)).limit(1);
    if (users.length === 0) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const user = users[0];
    if (!this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status === 'pending') {
      throw new UnauthorizedException('账号待审批，请等待管理员批准');
    }
    if (user.status === 'banned') {
      throw new UnauthorizedException(`账号已被封禁：${user.banReason || '违反网站规定'}`);
    }
    if (user.status === 'rejected') {
      throw new UnauthorizedException('注册申请已被拒绝');
    }

    const token = this.generateToken(user.id);
    return {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role as NewsUser['role'],
        status: user.status as NewsUser['status'],
        banReason: user.banReason ?? undefined,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  async getUserById(userId: string): Promise<NewsUser | null> {
    const users = await this.db.select().from(newsUser).where(eq(newsUser.id, userId)).limit(1);
    if (users.length === 0) return null;
    const u = users[0];
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role as NewsUser['role'],
      status: u.status as NewsUser['status'],
      banReason: u.banReason ?? undefined,
      createdAt: u.createdAt.toISOString(),
    };
  }
}
