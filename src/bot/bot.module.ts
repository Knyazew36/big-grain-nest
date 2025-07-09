import { Module } from '@nestjs/common';
import { TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule, PrismaService } from 'nestjs-prisma';
import { Context } from 'telegraf';
import { ProductsModule } from 'src/products/products.module';
import { BotService } from './bot.service';
import { NextFunction } from 'express';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    ConfigModule, // чтобы получить TG_BOT_TOKEN
    PrismaModule, // экспортирует PrismaService
    ProductsModule, // нужен для ProductsService в BotUpdate
  ],
  providers: [PrismaService, BotUpdate, BotService, NotificationService],
  exports: [BotUpdate, BotService, NotificationService],
})
export class BotModule {}
