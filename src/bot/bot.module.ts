import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, PrismaService } from 'nestjs-prisma';
import { ProductsModule } from 'src/products/products.module';
import { BotService } from './bot.service';
import { NotificationModule } from './notification.module';
import { AuthModule } from '../auth/auth.module';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    ConfigModule, // чтобы получить TG_BOT_TOKEN
    PrismaModule, // экспортирует PrismaService
    ProductsModule, // нужен для ProductsService в BotUpdate
    NotificationModule,
    forwardRef(() => AuthModule), // для AllowedPhoneService
  ],
  providers: [PrismaService, BotUpdate, BotService],
  exports: [BotUpdate, BotService],
})
export class BotModule {}
