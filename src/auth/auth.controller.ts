import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
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
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Новый эндпоинт: создать заявку на доступ (или вернуть существующую)
   */
  @Post('access-request')
  async createAccessRequest(@Body() dto: CreateAccessRequestDto) {
    console.warn('DEPRECATED: Используйте авторизацию через номер телефона в боте');
    return this.authService.createAccessRequest(dto.telegramId, dto.message);
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Новый эндпоинт: получить все заявки (для админа)
   */
  @Post('access-requests')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async getAllAccessRequests(@Body('status') status?: string) {
    console.warn('DEPRECATED: Используйте авторизацию через номер телефона в боте');
    return this.authService.getAllAccessRequests(status);
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Новый эндпоинт: получить только PENDING заявки (для админа)
   */
  @Post('pending-access-requests')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async getPendingAccessRequests() {
    console.warn('DEPRECATED: Используйте авторизацию через номер телефона в боте');
    return this.authService.getAllAccessRequests('PENDING');
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Новый эндпоинт: отклонить заявку на доступ (только для админа)
   */
  @Post('decline-access-request')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async declineAccessRequest(
    @Body('requestId') requestId: number,
    @Body('adminTelegramId') adminTelegramId: string,
    @Body('adminNote') adminNote?: string,
  ) {
    console.warn('DEPRECATED: Используйте авторизацию через номер телефона в боте');
    return this.authService.declineAccessRequest(requestId, adminTelegramId, adminNote);
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Новый эндпоинт: одобрить заявку на доступ (только для админа)
   */
  @Post('approve-access-request')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async approveAccessRequest(
    @Body('requestId') requestId: number,
    @Body('adminTelegramId') adminTelegramId: string,
    @Body('adminNote') adminNote?: string,
  ) {
    console.warn('DEPRECATED: Используйте авторизацию через номер телефона в боте');
    return this.authService.approveAccessRequest(requestId, adminTelegramId, adminNote);
  }

  /**
   * Новый эндпоинт: получить заявки пользователя по telegramId
   */
  @Post('user-access-requests')
  async getUserAccessRequests(@Body('telegramId') telegramId: string) {
    return this.authService.getUserAccessRequests(telegramId);
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
