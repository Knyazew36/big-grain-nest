import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // чтобы считывать TG_BOT_TOKEN из process.env
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('TG_BOT_TOKEN'),
        launchOptions: {
          // polling: true по умолчанию для development
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BotUpdate],
})
export class BotModule {}
