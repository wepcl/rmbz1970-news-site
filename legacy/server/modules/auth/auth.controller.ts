import { Controller, Post, Body, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  NewsUser,
} from '@shared/api.interface';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  async me(@Req() req: Request): Promise<NewsUser> {
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
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }
}
