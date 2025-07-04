// src/bot/bot.update.ts
import { Update, Start, Command, Action, Ctx, Hears } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ProductsService } from '../products/products.service';
import { PrismaService } from 'nestjs-prisma';

@Update()
export class BotUpdate {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  private keyboard = [
    [
      { text: '📦 Остатки', callback_data: 'inventory' },
      { text: '➕ Добавить', callback_data: 'add' },
    ],
  ];

  private async showMenu(ctx: Context) {
    await ctx.reply('🔹 Главное меню:', {
      reply_markup: { inline_keyboard: this.keyboard },
    });
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.ensureUser(ctx);
    await this.showMenu(ctx);
  }

  @Command('menu')
  async onMenu(@Ctx() ctx: Context) {
    await this.showMenu(ctx);
  }

  @Action('inventory')
  async onInventory(@Ctx() ctx: Context) {
    await this.ensureUser(ctx);

    // 1) удаляем сообщение с меню
    const msg = ctx.callbackQuery?.message;
    if (msg?.message_id) {
      await ctx.deleteMessage(msg.message_id);
    }

    // 2) отправляем список
    const items = await this.productsService.findAll();
    if (items.length === 0) {
      await ctx.reply('Список товаров пуст 😢');
    } else {
      const lines = items.map((p) => {
        const mark = p.quantity >= p.minThreshold ? '🟢' : '🔴';
        return `${mark} ${p.name} — ${p.quantity} (мин. ${p.minThreshold})`;
      });
      await ctx.reply(`📦 *Актуальные остатки:*\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
      });
    }

    // 3) снова меню
    await this.showMenu(ctx);
  }

  @Action('add')
  async onAskAdd(@Ctx() ctx: Context) {
    await this.ensureUser(ctx);

    // удаляем предыдущее меню
    const msg = ctx.callbackQuery?.message;
    if (msg?.message_id) {
      await ctx.deleteMessage(msg.message_id);
    }

    // отправляем инструкцию
    await ctx.reply(
      '📝 Введите товар в формате:\n' +
        '`Название;Количество;Мин.порог`\n\n' +
        'Пример: `Маски;100;50`',
      { parse_mode: 'Markdown' },
    );
  }

  @Hears(/^(.+);\s*(\d+)\s*;\s*(\d+)$/)
  async onAddProduct(@Ctx() ctx: Context) {
    await this.ensureUser(ctx);

    // удаляем сообщение пользователя с вводом
    const userMsg = ctx.message;
    if (userMsg?.message_id) {
      await ctx.deleteMessage(userMsg.message_id);
    }

    // парсим и создаём
    const match = (ctx as any).match as RegExpMatchArray;
    const [, rawName, rawQty, rawMin] = match;
    const name = rawName.trim();
    const quantity = parseInt(rawQty, 10);
    const minThreshold = parseInt(rawMin, 10);

    try {
      const product = await this.productsService.create({ name, quantity, minThreshold });
      await ctx.reply(
        `✅ Товар добавлен:\n` +
          `• ${product.name}\n` +
          `• Количество: ${product.quantity}\n` +
          `• Мин. порог: ${product.minThreshold}`,
      );
    } catch (err) {
      await ctx.reply(`❌ Ошибка: ${err.message}`);
    }

    // в конце снова меню
    await this.showMenu(ctx);
  }

  @Action(/approve_access:(.+)/)
  async onApproveAccess(@Ctx() ctx: Context) {
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    const telegramId = data?.split(':')[1];
    if (!telegramId) {
      await ctx.reply('Ошибка: не удалось определить пользователя.');
      return;
    }
    await this.prisma.user.update({ where: { telegramId }, data: { role: 'OPERATOR' } });
    await ctx.reply('✅ Доступ одобрен.');
    // Можно уведомить пользователя, если нужно
  }

  @Action(/decline_access:(.+)/)
  async onDeclineAccess(@Ctx() ctx: Context) {
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    const telegramId = data?.split(':')[1];
    if (!telegramId) {
      await ctx.reply('Ошибка: не удалось определить пользователя.');
      return;
    }
    await ctx.reply('❌ Доступ отклонён.');
    // Можно уведомить пользователя, если нужно
  }

  private async ensureUser(ctx: Context) {
    if (ctx.from?.id) {
      const tgId = String(ctx.from.id);
      const user = await this.prisma.user.upsert({
        where: { telegramId: tgId },
        update: {},
        create: { telegramId: tgId },
      });
      ctx.state.user = user;
    }
  }
}
