import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context as TelegrafContext } from 'telegraf';

@Injectable()
export class BotService implements OnModuleInit {
  constructor(@InjectBot() private readonly bot: Telegraf<TelegrafContext>) {}

  async onModuleInit() {
    // Устанавливаем список команд для меню (кнопка меню появится автоматически)
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'phone', description: 'Авторизация по номеру телефона' },
    ]);
  }
}
