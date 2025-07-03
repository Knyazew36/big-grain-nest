// src/bot/bot.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context as TelegrafContext } from 'telegraf';
import { Product } from '@prisma/client';

@Injectable()
export class BotService implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegrafContext>,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // регистрируем команды
    await this.bot.telegram.setMyCommands([
      { command: 'menu', description: 'Открыть главное меню' },
      { command: 'add', description: 'Добавить товар' },
      { command: 'inventory', description: 'Показать остатки' },
    ]);

    // подключаем middleware
    this.bot.use(async (ctx, next) => {
      // патчим reply через any, чтобы соответствовать оригинальному типу
      const originalReply = (ctx as any).reply.bind(ctx);
      (ctx as any).reply = async (text: string, extra?: any) => {
        console.log('📤 reply →', text, extra);
        return originalReply(text, extra);
      };

      // user upsert
      if (ctx.from?.id) {
        const tgId = String(ctx.from.id);
        const user = await this.prisma.user.upsert({
          where: { telegramId: tgId },
          update: {},
          create: { telegramId: tgId },
        });
        ctx.state.user = user;
      }

      return next();
    });
  }

  async notifyLowStock(products: Product[]) {
    if (!products.length) return;
    const message =
      '⚠️ Низкий остаток по продуктам:\n' +
      products.map((p) => `• ${p.name}: ${p.quantity} (минимум: ${p.minThreshold})`).join('\n');
    // Получаем всех пользователей (например, с ролью admin, либо всех)
    const users = await this.prisma.user.findMany();
    for (const user of users) {
      if (user.telegramId) {
        try {
          await this.bot.telegram.sendMessage(user.telegramId, message);
        } catch (e) {
          console.error('Ошибка отправки уведомления:', e);
        }
      }
    }
  }
}
