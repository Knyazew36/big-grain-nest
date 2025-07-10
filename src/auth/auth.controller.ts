import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '@prisma/client';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Точки входа: принимает initData из Telegram WebApp и возвращает инфо о пользователе
   */
  @Post('login')
  async login(@Body('initData') initData: string) {
    const user = await this.authService.validateTelegramInitData(initData);
    // Проверяем роль пользователя
    if (user.role === Role.BLOCKED) {
      throw new Error('Access denied: user is blocked');
    }
    if (user.role !== Role.OPERATOR && user.role !== Role.ADMIN) {
      // Можно вернуть 403 Forbidden
      throw new Error('Access denied: insufficient permissions');
    }
    // можно вернуть роль и id, или JWT (по желанию)
    return { id: user.id, role: user.role };
  }

  /**
   * Новый эндпоинт: заблокировать пользователя (только для админа)
   */
  @Post('block-user')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async blockUser(@Body('telegramId') telegramId: string, @Body('adminNote') adminNote?: string) {
    return this.authService.blockUser(telegramId, adminNote);
  }

  /**
   * Новый эндпоинт: разблокировать пользователя (только для админа)
   */
  @Post('unblock-user')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async unblockUser(@Body('telegramId') telegramId: string) {
    return this.authService.unblockUser(telegramId);
  }

  /**
   * Новый эндпоинт: получить информацию о пользователе
   */
  @Post('user-info')
  async getUserInfo(@Body('telegramId') telegramId: string) {
    return this.authService.getUserInfo(telegramId);
  }

  /**
   * Новый эндпоинт: проверить статус авторизации пользователя
   */
  @Post('auth-status')
  async getAuthStatus(@Body('telegramId') telegramId: string) {
    const user = await this.authService.findByTelegramId(telegramId);

    if (!user) {
      return {
        isAuthorized: false,
        message: 'Пользователь не найден',
        needsPhoneAuth: true,
      };
    }

    if (user.role === 'BLOCKED') {
      return {
        isAuthorized: false,
        message: 'Пользователь заблокирован',
        needsPhoneAuth: false,
        role: user.role,
      };
    }

    // Проверяем, есть ли привязанный номер телефона
    const userWithPhones = await this.authService.findByTelegramIdWithPhones(telegramId);
    const hasPhoneAuth =
      userWithPhones && userWithPhones.allowedPhones && userWithPhones.allowedPhones.length > 0;

    return {
      isAuthorized: hasPhoneAuth && user.role !== ('BLOCKED' as any),
      message: hasPhoneAuth
        ? 'Пользователь авторизован'
        : 'Требуется авторизация через номер телефона',
      needsPhoneAuth: !hasPhoneAuth,
      role: user.role,
      hasPhoneAuth,
    };
  }
}
