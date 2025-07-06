import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
}
