// src/bot/bot.update.ts
import { Update, Start, Command, Action, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ProductsService } from '../products/products.service';
import { PrismaService } from 'nestjs-prisma';
import { NotificationService } from './notification.service';
// import { BotService } from './bot.service';
import { AllowedPhoneService } from '../auth/allowed-phone.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly allowedPhoneService: AllowedPhoneService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply('👋 Привет! Я бот для управления остатками товаров.');
    return;
  }

  @Action(/approve_access:(.+):(.+)/)
  async onApproveAccess(@Ctx() ctx: Context) {
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    const parts = data?.split(':');
    const telegramId = parts?.[1];
    const requestId = parseInt(parts?.[2] || '0', 10);

    if (!telegramId || !requestId) {
      await ctx.reply('Ошибка: не удалось определить пользователя или заявку.');
      return;
    }

    try {
      // Проверяем права доступа (только OWNER, ADMIN, IT могут одобрять)
      await this.ensureUser(ctx);
      const currentUser = ctx.state.user;
      if (!currentUser || !['OWNER', 'ADMIN', 'IT'].includes(currentUser.role)) {
        await ctx.reply('❌ У вас нет прав для одобрения заявок.');
        return;
      }

      // Находим заявку по ID
      const request = await this.prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        await ctx.reply('❌ Заявка не найдена.');
        return;
      }

      if (request.status !== 'PENDING') {
        await ctx.reply('❌ Заявка уже обработана.');
        return;
      }

      // Обновляем роль пользователя на OPERATOR
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { role: 'OPERATOR' },
      });

      // Обновляем статус заявки
      await this.prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          processedById: currentUser.id,
        },
      });

      // Отправляем уведомление пользователю
      await this.notificationService.notifyAccessRequestApproved(request.user.telegramId);
      await ctx.reply('✅ Доступ одобрен. Пользователь уведомлен.');
    } catch (error) {
      console.error('Ошибка при одобрении заявки:', error);
      await ctx.reply('❌ Ошибка при одобрении заявки.');
    }
  }

  @Action(/decline_access:(.+):(.+)/)
  async onDeclineAccess(@Ctx() ctx: Context) {
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    const parts = data?.split(':');
    const telegramId = parts?.[1];
    const requestId = parseInt(parts?.[2] || '0', 10);

    if (!telegramId || !requestId) {
      await ctx.reply('Ошибка: не удалось определить пользователя или заявку.');
      return;
    }

    try {
      // Проверяем права доступа (только OWNER, ADMIN, IT могут отклонять)
      await this.ensureUser(ctx);
      const currentUser = ctx.state.user;
      if (!currentUser || !['OWNER', 'ADMIN', 'IT'].includes(currentUser.role)) {
        await ctx.reply('❌ У вас нет прав для отклонения заявок.');
        return;
      }

      // Находим заявку по ID
      const request = await this.prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        await ctx.reply('❌ Заявка не найдена.');
        return;
      }

      if (request.status !== 'PENDING') {
        await ctx.reply('❌ Заявка уже обработана.');
        return;
      }

      // Обновляем статус заявки
      await this.prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: 'DECLINED',
          processedAt: new Date(),
          processedById: currentUser.id,
        },
      });

      // Отправляем уведомление пользователю
      await this.notificationService.notifyAccessRequestDeclined(request.user.telegramId);
      await ctx.reply('❌ Доступ отклонён. Пользователь уведомлен.');
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      await ctx.reply('❌ Ошибка при отклонении заявки.');
    }
  }

  @Command('phone')
  async onPhoneCommand(@Ctx() ctx: Context) {
    await ctx.reply('Пожалуйста, отправьте свой номер телефона, нажав на кнопку ниже:', {
      reply_markup: {
        keyboard: [[{ text: '📱 Отправить номер', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    const contact = (ctx.message as any).contact;
    if (!contact || !contact.phone_number) {
      await ctx.reply('Не удалось получить номер телефона.');
      return;
    }
    const phone = contact.phone_number.startsWith('+')
      ? contact.phone_number
      : `+${contact.phone_number}`;
    const telegramId = String(ctx.from.id);

    // Проверяем, разрешён ли номер
    const allowed = await this.allowedPhoneService.isPhoneAllowed(phone);
    if (!allowed) {
      await ctx.reply('❌ Ваш номер не найден в списке разрешённых. Доступ запрещён.');
      return;
    }

    // Привязываем номер к пользователю
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: { data: { ...contact } },
      create: { telegramId, data: { ...contact } },
    });
    await this.allowedPhoneService.bindPhoneToUser(phone, user.id);

    // Можно выдать роль OPERATOR или другую, если нужно
    await this.prisma.user.update({ where: { id: user.id }, data: { role: 'OPERATOR' } });

    await ctx.reply('✅ Ваш номер подтверждён! Вам открыт доступ.');
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
