import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [ConfigModule],

  controllers: [AuthController, PrismaService],
  providers: [AuthService, TelegramAuthGuard],
  exports: [TelegramAuthGuard],
})
export class AuthModule {}
