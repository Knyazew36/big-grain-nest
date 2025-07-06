import { Module } from '@nestjs/common';
import { TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule, PrismaService } from 'nestjs-prisma';
import { Context } from 'telegraf';
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
      useFactory: (cfg: ConfigService, prisma: PrismaService): TelegrafModuleOptions => {
        // Определяем токен в зависимости от окружения
        const nodeEnv = cfg.get<string>('NODE_ENV') || 'development';
        const isDev = nodeEnv === 'development';

        const devToken = cfg.get<string>('TG_BOT_TOKEN_DEV');
        const prodToken = cfg.get<string>('TG_BOT_TOKEN');

        const token = isDev ? devToken : prodToken;

        if (!token) {
          throw new Error(
            `Bot token not found for ${isDev ? 'development' : 'production'} environment`,
          );
        }

        console.log(
          `🐝 [BotModule] Environment: ${nodeEnv}, Using ${isDev ? 'DEV' : 'PROD'} bot token`,
        );

        return {
          token,
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
        };
      },
    }),
  ],
  providers: [PrismaService, BotUpdate, BotService],
  exports: [BotUpdate, BotService],
})
export class BotModule {}
