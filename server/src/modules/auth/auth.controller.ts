import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieName = 'sums_refresh';

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto, this.metadata(request));
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { data: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn, user: result.user } };
  }

  @Public()
  @ApiCookieAuth('sums_refresh')
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const raw = (request.cookies as Record<string, string | undefined> | undefined)?.[this.cookieName];
    const result = await this.auth.refresh(raw, this.metadata(request));
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { data: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn, user: result.user } };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(user, this.metadata(request));
    this.clearRefreshCookie(response);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logoutAll(user, this.metadata(request));
    this.clearRefreshCookie(response);
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.auth.me(user) };
  }

  @ApiBearerAuth()
  @Get('sessions')
  async sessions(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.auth.sessions(user) };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return { data: await this.auth.forgotPassword(dto.identifier, this.metadata(request)) };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    await this.auth.resetPassword(dto, this.metadata(request));
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.changePassword(user, dto, this.metadata(request));
    this.clearRefreshCookie(response);
  }

  private metadata(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.requestId,
    };
  }

  private setRefreshCookie(response: Response, value: string) {
    response.cookie(this.cookieName, value, {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE') === 'true' || this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
      maxAge: (this.config.get<number>('REFRESH_TOKEN_TTL_DAYS') ?? 7) * 86_400_000,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(this.cookieName, {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE') === 'true' || this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
    });
  }
}
