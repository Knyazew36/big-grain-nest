import { PrismaService } from 'nestjs-prisma';
import { Update, Start, Ctx, Hears, Command } from 'nestjs-telegraf';
import { ProductsService } from 'src/products/products.service';
import { Context } from 'telegraf';
import { requireRole } from './utils/bot.utlis';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Update()
export class BotUpdate {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  private async ensureUser(ctx: Context) {
    if (ctx.from?.id) {
      await this.prisma.user.upsert({
        where: { telegramId: String(ctx.from.id) },
        update: {},
        create: { telegramId: String(ctx.from.id) },
      });
    }
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    // console.log('ctx', ctx.from);
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

  @Command('setrole')
  async onSetRole(@Ctx() ctx: Context) {
    console.log('» setrole: ctx.state.user =', ctx.state.user);
    if (!requireRole(ctx, Role.ADMIN)) return;
    const text = (ctx.message as any).text;
    const parts = text.split(' ');
    const tgId = parts[1];
    const newRole = parts[2] as Role;
    if (!tgId || ![Role.ADMIN, Role.OPERATOR].includes(newRole)) {
      return ctx.reply('Использование: /setrole <telegramId> <ADMIN|OPERATOR>');
    }

    await this.prisma.user.update({
      where: { telegramId: tgId },
      data: { role: newRole },
    });

    ctx.reply(`✅ Пользователю ${tgId} присвоена роль ${newRole}`);
  }

  // Можно добавить 👇 для теста
  @Hears(/.*/)
  async fallback(@Ctx() ctx: Context) {
    await ctx.reply('Не понял команду. Нажми /start или кнопку «Остатки».');
  }
}
