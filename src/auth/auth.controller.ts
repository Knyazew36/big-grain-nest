import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BotService } from '../bot/bot.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly botService: BotService,
  ) {}

  /**
   * Точки входа: принимает initData из Telegram WebApp и возвращает инфо о пользователе
   */
  @Post('login')
  async login(@Body('initData') initData: string) {
    const user = await this.authService.validateTelegramInitData(initData);
    // Проверяем роль пользователя
    if (user.role !== 'OPERATOR' && user.role !== 'ADMIN') {
      // Можно вернуть 403 Forbidden
      throw new Error('Access denied: insufficient permissions');
    }
    // можно вернуть роль и id, или JWT (по желанию)
    return { id: user.id, role: user.role };
  }

  /**
   * Эндпоинт для запроса доступа: пользователь с ролью GUEST может отправить запрос на доступ
   */
  @Post('request-access')
  async requestAccess(@Body('telegramId') telegramId: string) {
    const user = await this.authService.findByTelegramId(telegramId);
    if (!user) {
      return { status: 'error', message: 'User not found' };
    }
    await this.botService.notifyAdminAccessRequest(user);
    return { status: 'ok' };
  }
}
