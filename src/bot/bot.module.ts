import { Module, OnModuleInit } from '@nestjs/common';
import { InjectBot, TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule, PrismaService } from 'nestjs-prisma';
import { Context, Telegraf } from 'telegraf';
import { ProductsModule } from 'src/products/products.module';
import { BotService } from './bot.service';
import { NextFunction } from 'express';

@Module({
  imports: [
    ConfigModule, // чтобы получить TG_BOT_TOKEN
    PrismaModule, // экспортирует PrismaService
    ProductsModule, // нужен для ProductsService в BotUpdate
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, PrismaModule], // <-- обязательно импортируем PrismaModule
      inject: [ConfigService, PrismaService], // <-- инжектим оба
      useFactory: (cfg: ConfigService, prisma: PrismaService): TelegrafModuleOptions => ({
        token: cfg.get<string>('TG_BOT_TOKEN'),
        middlewares: [
          async (ctx: Context, next: NextFunction) => {
            console.log('🐝 [middleware] got updateType=', ctx.updateType, 'from', ctx.from?.id);
            if (ctx.from?.id) {
              const user = await prisma.user.upsert({
                where: { telegramId: String(ctx.from.id) },
                update: {},
                create: { telegramId: String(ctx.from.id) },
              });
              console.log('🐝 [middleware] upserted user', user);
              ctx.state.user = user;
            }
            return next();
          },
        ],
      }),
    }),
  ],
  providers: [PrismaService, BotUpdate, BotService],
})
export class BotModule {}
