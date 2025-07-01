import { Module, OnModuleInit } from '@nestjs/common';
import { InjectBot, TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from 'src/products/products.module';
import { PrismaModule, PrismaService } from 'nestjs-prisma';
import { Context, Telegraf } from 'telegraf';
import { ProductsService } from 'src/products/products.service';
import { BotService } from './bot.service';
import { NextFunction } from 'express';

// @Module({
//   imports: [
//     ConfigModule, // чтобы считывать TG_BOT_TOKEN из process.env
//     TelegrafModule.forRootAsync({
//       imports: [ConfigModule],
//       useFactory: (config: ConfigService) => ({
//         token: config.get<string>('TG_BOT_TOKEN'),
//         launchOptions: {
//           // polling: true по умолчанию для development
//         },
//       }),
//       inject: [ConfigService],
//     }),
//     ProductsModule,
//     PrismaModule,
//   ],
//   providers: [BotUpdate, ProductsService, PrismaService, BotService],
// })
// export class BotModule {}

// src/bot/bot.module.ts

// @Module({
//   imports: [
//     ConfigModule, // для TG_BOT_TOKEN и WEBAPP_URL
//     PrismaModule, // ваш глобальный PrismaModule
//     TelegrafModule.forRootAsync({
//       imports: [ConfigModule],
//       useFactory: (cfg: ConfigService) => ({
//         token: cfg.get<string>('TG_BOT_TOKEN'),
//       }),
//       inject: [ConfigService],
//     }),
//     ProductsModule, // сюда уже входит ProductsService
//   ],
//   providers: [
//     BotUpdate, // только update-хэндлер
//   ],
// })
// export class BotModule implements OnModuleInit {
//   constructor(
//     @InjectBot() private readonly bot: Telegraf,
//     private readonly prisma: PrismaService,
//   ) {}

//   onModuleInit() {
//     // Этот middleware будет выполняться перед каждым update-хэндлером
//     this.bot.use(async (ctx, next) => {
//       if (ctx.from?.id) {
//         // upsert пользователя
//         const tgId = String(ctx.from.id);
//         const user = await this.prisma.user.upsert({
//           where: { telegramId: tgId },
//           update: {},
//           create: { telegramId: tgId },
//         });
//         // сохраняем в контекст, чтобы у хэндлеров был доступ к role и id
//         ctx.state.user = user;
//       }
//       return next();
//     });
//   }
// }

// @Module({
//   imports: [
//     ConfigModule,
//     PrismaModule,
//     TelegrafModule.forRootAsync({
//       imports: [ConfigModule],
//       useFactory: (cfg: ConfigService) => ({ token: cfg.get('TG_BOT_TOKEN') }),
//       inject: [ConfigService],
//     }),
//     ProductsModule,
//   ],
//   providers: [BotUpdate, PrismaService, ProductsService],
// })
// export class BotModule implements OnModuleInit {
//   constructor(
//     @InjectBot() private readonly bot: Telegraf<any>,
//     private readonly prisma: PrismaService,
//   ) {}

//   onModuleInit() {
//     this.bot.use(async (ctx, next) => {
//       console.log('» Middleware: got update from', ctx.from?.id);
//       if (ctx.from?.id) {
//         const tgId = String(ctx.from.id);
//         const user = await this.prisma.user.upsert({
//           where: { telegramId: tgId },
//           update: {},
//           create: { telegramId: tgId },
//         });
//         console.log('» Middleware: upserted user', user);
//         ctx.state.user = user;
//       }
//       return next();
//     });
//   }
// }

// src/bot/bot.module.ts

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
  providers: [ProductsService, 1PrismaService, BotUpdate],
})
export class BotModule {}
