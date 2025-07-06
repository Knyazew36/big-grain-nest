import { MiddlewareConsumer, NestModule, Module } from '@nestjs/common';
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
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { UserModule } from './user/user.module';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { WinstonModule } from 'nest-winston';

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // архивировать старые логи
  maxSize: '10m', // максимальный размер файла
  maxFiles: '15d', // хранить файлы за последние 30 дней
  level: 'info', // уровень логирования
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json(),
  ),
});

@Module({
  imports: [
    PrismaModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // явно указываем путь к .env
      ignoreEnvFile: false, // не игнорировать .env
    }),

    WinstonModule.forRoot({
      transports: [
        // Транспорт для логирования в консоль
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(), // Добавляет метку времени
            winston.format.ms(), // Выводит время между логами
            winston.format.colorize(), // Раскрашивает логи (удобно в разработке)
            winston.format.printf(
              ({ timestamp, level, message, ms }) => `${timestamp} [${level}]: ${message} ${ms}`,
            ),
          ),
        }),
        // Транспорт для логирования ошибок в файл
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 1024 * 1024 * 10,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        // Транспорт для логирования всех уровней в файл
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 1024 * 1024 * 10,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        dailyRotateFileTransport,
      ],
    }),

    BotModule,
    UserModule,
    AuthModule,
    ProductsModule,
    ShiftsModule,
    ReceiptsModule,
    ScheduleModule.forRoot(),
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
