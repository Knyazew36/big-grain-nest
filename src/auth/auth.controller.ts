import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BotService } from '../bot/bot.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '@prisma/client';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

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
   * Эндпоинт для запроса доступа: пользователь с ролью GUEST может отправить запрос на доступ
   */
  // @Post('request-access')
  // async requestAccess(@Body('telegramId') telegramId: string) {
  //   const user = await this.authService.findByTelegramId(telegramId);
  //   if (!user) {
  //     return { status: 'error', message: 'User not found' };
  //   }
  //   await this.botService.notifyAdminAccessRequest(user);
  //   return { status: 'ok' };
  // }

  /**
   * Новый эндпоинт: создать заявку на доступ (или вернуть существующую)
   */
  @Post('access-request')
  async createAccessRequest(@Body() dto: CreateAccessRequestDto) {
    return this.authService.createAccessRequest(dto.telegramId, dto.message);
  }

  /**
   * Новый эндпоинт: получить все заявки (для админа)
   */
  @Post('access-requests')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async getAllAccessRequests(@Body('status') status?: string) {
    return this.authService.getAllAccessRequests(status);
  }

  /**
   * Новый эндпоинт: получить только PENDING заявки (для админа)
   */
  @Post('pending-access-requests')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async getPendingAccessRequests() {
    return this.authService.getAllAccessRequests('PENDING');
  }

  /**
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
    return this.authService.declineAccessRequest(requestId, adminTelegramId, adminNote);
  }

  /**
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
}
