import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const initData = request.headers['authorization'] as string;
    if (!initData) {
      throw new UnauthorizedException('No Telegram auth data');
    }

    const params = new URLSearchParams(initData);
    const data: Record<string, string> = {};
    params.forEach((value, key) => (data[key] = value));

    const hash = data['hash'];
    if (!hash) {
      throw new UnauthorizedException('Invalid auth data');
    }
    delete data['hash'];

    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const botToken = this.config.get<string>('TG_BOT_TOKEN');
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Data verification failed');
    }

    const telegramId = data['id'];
    // Upsert user
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });
    (request as any).user = user;
    return true;
  }
}
