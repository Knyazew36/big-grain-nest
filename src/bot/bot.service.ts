// src/bot/bot.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context as TelegrafContext } from 'telegraf';

@Injectable()
export class BotService implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegrafContext>,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.bot.use(async (ctx, next) => {
      console.log('🐝 Middleware: got update from', ctx.from?.id);
      if (ctx.from?.id) {
        const tgId = String(ctx.from.id);
        const user = await this.prisma.user.upsert({
          where: { telegramId: tgId },
          update: {},
          create: { telegramId: tgId },
        });
        console.log('🐝 Middleware: upserted user', user);
        ctx.state.user = user;
      }
      return next();
    });
  }
}
