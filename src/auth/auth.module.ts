import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AllowedPhoneController } from './allowed-phone.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { PrismaService } from 'nestjs-prisma';
import { PrismaModule } from 'nestjs-prisma';
import { AllowedPhoneService } from './allowed-phone.service';
import { NotificationModule } from '../bot/notification.module';

@Module({
  imports: [ConfigModule, PrismaModule, NotificationModule],

  controllers: [AuthController, AllowedPhoneController],
  providers: [
    PrismaService,
    AuthService,
    TelegramAuthGuard,
    ConfigService,
    AllowedPhoneService,
    // BotService,
  ],
  exports: [TelegramAuthGuard, AllowedPhoneService],
})
export class AuthModule {}
