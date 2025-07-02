// src/auth/guards/telegram-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { validate, parse } from '@telegram-apps/init-data-node';
@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = String(req.header('authorization') || '');

    // 1) Разбираем “tma <initDataRaw>”
    const [authType, initDataRaw = ''] = authHeader.split(' ');
    if (authType !== 'tma' || !initDataRaw) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    // 2) Проверяем подпись и срок жизни (по умолчанию 3600 сек)
    const botToken = this.config.get<string>('TG_BOT_TOKEN') || '';
    try {
      validate(initDataRaw, botToken, { expiresIn: 3600 });
    } catch (err: any) {
      // сюда придёт ошибка как “Signature mismatch” или “Expired”
      throw new UnauthorizedException(`InitData validation failed: ${err.message}`);
    }

    // 3) Парсим initData
    let initData;
    try {
      initData = parse(initDataRaw);
    } catch (err: any) {
      throw new UnauthorizedException(`InitData parse failed: ${err.message}`);
    }

    // 4) Апсертим пользователя в БД
    // initData.user.id — это number
    const telegramId = String(initData.user.id);
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });

    // 5) Кладём пользователя в request.user
    (req as any).user = user;
    return true;
  }
}
