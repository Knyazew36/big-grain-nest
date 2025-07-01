import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { PrismaService } from 'nestjs-prisma';
import { PrismaModule } from 'nestjs-prisma';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [ConfigModule, PrismaModule],

  controllers: [AuthController],
  providers: [PrismaService, AuthService, TelegramAuthGuard, ConfigService],
  exports: [TelegramAuthGuard],
})
export class AuthModule {}
