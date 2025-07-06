import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessRequest } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Проверяет подпись initData, апсертит пользователя и возвращает его запись
   */
  async validateTelegramInitData(initData: string) {
    if (!initData) {
      throw new UnauthorizedException('No initData provided');
    }

    // парсим строку
    const params = new URLSearchParams(initData);
    const data: Record<string, string> = {};
    params.forEach((value, key) => (data[key] = value));

    const hash = data.hash;
    if (!hash) {
      throw new UnauthorizedException('Invalid initData (no hash)');
    }
    delete data.hash;

    // строим data_check_string
    const dataCheckString = Object.keys(data)
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join('\n');

    // считаем HMAC

    const nodeEnv = this.config.get<string>('NODE_ENV') || 'development';
    const isDev = nodeEnv === 'development';

    const devToken = this.config.get<string>('TG_BOT_TOKEN_DEV');
    const prodToken = this.config.get<string>('TG_BOT_TOKEN');

    const token = isDev ? devToken : prodToken;

    const secretKey = crypto.createHash('sha256').update(token).digest();
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Data verification failed');
    }

    // апсертим пользователя
    const telegramId = data.id;

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: { data },
      create: { telegramId, data },
    });

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  /**
   * Создать заявку на доступ, если нет активной
   */
  async createAccessRequest(telegramId: string, message?: string) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new UnauthorizedException('User not found');

    // Блокированные пользователи не могут создавать заявки
    if (user.role === 'BLOCKED') {
      throw new UnauthorizedException('Blocked users cannot create access requests');
    }

    // Проверяем, есть ли уже активная заявка
    const existing = await this.prisma.accessRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });
    if (existing) return { status: 'pending', requestId: existing.id };
    const request = await this.prisma.accessRequest.create({
      data: { userId: user.id, message },
    });
    return { status: 'created', requestId: request.id };
  }

  /**
   * Получить все заявки (для админа)
   */
  async getAllAccessRequests(status?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    return this.prisma.accessRequest.findMany({
      where,
      include: { user: true, processedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Отклонить заявку на доступ
   */
  async declineAccessRequest(requestId: number, adminTelegramId: string, adminNote?: string) {
    const admin = await this.findByTelegramId(adminTelegramId);
    if (!admin) throw new UnauthorizedException('Admin not found');

    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new UnauthorizedException('Access request not found');
    }

    if (request.status !== 'PENDING') {
      throw new UnauthorizedException('Access request is not pending');
    }

    return this.prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        adminNote,
        processedAt: new Date(),
        processedById: admin.id,
      },
      include: { user: true, processedBy: true },
    });
  }

  /**
   * Одобрить заявку на доступ
   */
  async approveAccessRequest(requestId: number, adminTelegramId: string, adminNote?: string) {
    const admin = await this.findByTelegramId(adminTelegramId);
    if (!admin) throw new UnauthorizedException('Admin not found');

    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new UnauthorizedException('Access request not found');
    }

    if (request.status !== 'PENDING') {
      throw new UnauthorizedException('Access request is not pending');
    }

    // Обновляем роль пользователя на OPERATOR
    await this.prisma.user.update({
      where: { id: request.userId },
      data: { role: 'OPERATOR' },
    });

    return this.prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        adminNote,
        processedAt: new Date(),
        processedById: admin.id,
      },
      include: { user: true, processedBy: true },
    });
  }

  /**
   * Проверить, есть ли заявка у пользователя
   */
  async getUserAccessRequests(telegramId: string) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.prisma.accessRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Заблокировать пользователя
   */
  async blockUser(telegramId: string, adminNote?: string) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new UnauthorizedException('User not found');

    const currentData = (user.data as any) || {};
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        role: 'BLOCKED',
        data: { ...currentData, blockedAt: new Date(), adminNote },
      },
    });
  }

  /**
   * Разблокировать пользователя
   */
  async unblockUser(telegramId: string) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new UnauthorizedException('User not found');

    const currentData = (user.data as any) || {};
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        role: 'GUEST',
        data: { ...currentData, unblockedAt: new Date() },
      },
    });
  }

  /**
   * Получить информацию о пользователе
   */
  async getUserInfo(telegramId: string) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      telegramId: user.telegramId,
      role: user.role,
      isBlocked: user.role === 'BLOCKED',
      createdAt: user.createdAt,
      data: user.data,
    };
  }
}
