import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context as TelegrafContext } from 'telegraf';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class NotificationService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegrafContext>,
    public readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Отправить сообщение пользователю
   */
  async sendMessage(telegramId: string, message: string, extra?: any) {
    try {
      return await this.bot.telegram.sendMessage(telegramId, message, extra);
    } catch (error) {
      console.error(`Ошибка отправки сообщения пользователю ${telegramId}:`, error);
      throw error;
    }
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Отправить уведомление об отклонении заявки
   */
  async notifyAccessRequestDeclined(telegramId: string, adminNote?: string) {
    const message = `❌ Ваша заявка на доступ была отклонена${adminNote ? `\n\nПричина: ${adminNote}` : ''}`;
    return this.sendMessage(telegramId, message);
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Отправить уведомление об одобрении заявки с кнопкой webapp
   */
  async notifyAccessRequestApproved(telegramId: string, adminNote?: string) {
    const webappUrl = this.config.get<string>('WEBAPP_URL') || 'https://big-grain-tg.vercel.app';
    const message = `✅ Ваша заявка на доступ была одобрена!${adminNote ? `\n\nКомментарий: ${adminNote}` : ''}`;

    return this.sendMessage(telegramId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: '🚀 Открыть приложение', web_app: { url: webappUrl } }]],
      },
    });
  }

  /**
   * @deprecated Используйте авторизацию через номер телефона в боте
   * Уведомить всех OWNER'ов о новой заявке на доступ
   */
  async notifyOwnersAccessRequest(user: any, requestId: number) {
    try {
      // Получаем всех пользователей с ролью OWNER
      const owners = await this.prisma.user.findMany({
        where: { role: 'OWNER', active: true },
      });

      if (owners.length === 0) {
        console.warn('Нет активных пользователей с ролью OWNER для уведомления');
        return;
      }

      // Получаем заявку для извлечения сообщения
      const request = await this.prisma.accessRequest.findUnique({
        where: { id: requestId },
      });

      const userData = user.data as any;
      const message = `🚪 Новая заявка на доступ\n\n👤 Пользователь:\nИмя: ${userData?.first_name || ''} ${userData?.last_name || ''}\nUsername: @${userData?.username || ''}\nTelegram ID: ${user.telegramId}\n\n📝 Сообщение: ${request?.message || 'Не указано'}\n\n🆔 ID заявки: ${requestId}`;

      // Отправляем уведомление каждому OWNER'у
      for (const owner of owners) {
        try {
          await this.bot.telegram.sendMessage(owner.telegramId, message, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ Одобрить',
                    callback_data: `approve_access:${user.telegramId}:${requestId}`,
                  },
                  {
                    text: '❌ Отклонить',
                    callback_data: `decline_access:${user.telegramId}:${requestId}`,
                  },
                ],
              ],
            },
          });
        } catch (error) {
          console.error(`Ошибка отправки уведомления OWNER'у ${owner.telegramId}:`, error);
        }
      }
    } catch (error) {
      console.error("Ошибка при уведомлении OWNER'ов о заявке на доступ:", error);
    }
  }
}
