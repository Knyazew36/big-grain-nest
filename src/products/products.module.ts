import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from 'nestjs-prisma';
import { BotService } from '../bot/bot.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from '../bot/notification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ScheduleModule, NotificationModule, UserModule],
  controllers: [ProductsController],
  providers: [PrismaService, ProductsService, BotService],
  exports: [ProductsService],
})
export class ProductsModule {}
