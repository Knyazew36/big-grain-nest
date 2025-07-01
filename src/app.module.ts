import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { BotModule } from './bot/bot.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from 'nestjs-prisma';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guards/roles.guard';
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
