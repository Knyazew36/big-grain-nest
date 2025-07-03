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
    const botToken = this.config.get<string>('TG_BOT_TOKEN');
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Data verification failed');
    }

    // апсертим пользователя
    const telegramId = data.id;
    const firstName = data.first_name || '';
    const lastName = data.last_name || '';
    const username = data.username || '';
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: { firstName, lastName, username, rawData: data },
      create: { telegramId, firstName, lastName, username, rawData: data },
    });

    return user;
  }
}
