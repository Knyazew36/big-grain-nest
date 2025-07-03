import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule, PrismaService } from 'nestjs-prisma';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './auth/guards/roles.guard';
import { TelegramAuthGuard } from './auth/guards/telegram-auth.guard';
import { ResponseInterceptor } from './auth/interceptors/response.interceptor';
import { ShiftsModule } from './shifts/shifts.module';
import { ReceiptsModule } from './receipts/receipts.module';
@Module({
  imports: [
    PrismaModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // явно указываем путь к .env
      ignoreEnvFile: false, // не игнорировать .env
    }),
    BotModule,
    AuthModule,
    ProductsModule,
    ShiftsModule,
    ReceiptsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // { provide: APP_GUARD, useClass: TelegramAuthGuard },
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
