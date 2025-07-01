import { Update, Start, Ctx, Hears, Command } from 'nestjs-telegraf';
import { ProductsService } from 'src/products/products.service';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  constructor(private readonly productsService: ProductsService) {}

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

  @Command('products') // <-- новый хэндлер
  async onProducts(@Ctx() ctx: Context) {
    const items = await this.productsService.findAll();
    if (items.length === 0) {
      return ctx.reply('Список товаров пуст 😢');
    }
    // Собираем текстовый ответ
    const lines = items.map((p) => {
      const status = p.quantity >= p.minThreshold ? '🟢' : '🔴';
      const unit = p.unit ? ` ${p.unit}` : '';
      return `${status} ${p.name} — ${p.quantity}${unit} (мин. ${p.minThreshold})`;
    });
    await ctx.reply(`📦 *Товары:*\n\n` + lines.join('\n'), { parse_mode: 'Markdown' });
  }

  // Можно добавить 👇 для теста
  @Hears(/.*/)
  async fallback(@Ctx() ctx: Context) {
    await ctx.reply('Не понял команду. Нажми /start или кнопку «Остатки».');
  }
}
