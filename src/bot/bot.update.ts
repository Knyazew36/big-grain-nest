import { Update, Start, Ctx, Hears, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    const name = ctx.from?.first_name || 'пользователь';
    await ctx.reply(
      `Привет, ${name}! 👋\n\nДобро пожаловать в управление складом.\n\nНажми кнопку ниже, чтобы открыть мини-приложение.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Остатки',
                web_app: { url: process.env.WEBAPP_URL + '/inventory' },
              },
            ],
          ],
        },
      },
    );
  }

  @Command('inventory')
  async onInventoryCommand(@Ctx() ctx: Context) {
    // Аналогично кнопке — можно редирект прямой ссылкой
    await ctx.reply('Открываю мини-приложение…', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть Остатки',
              web_app: { url: process.env.WEBAPP_URL + '/inventory' },
            },
          ],
        ],
      },
    });
  }

  // Можно добавить 👇 для теста
  @Hears(/.*/)
  async fallback(@Ctx() ctx: Context) {
    await ctx.reply('Не понял команду. Нажми /start или кнопку «Остатки».');
  }
}
