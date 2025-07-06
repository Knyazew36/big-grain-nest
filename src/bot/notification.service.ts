import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context as TelegrafContext } from 'telegraf';

@Injectable()
export class NotificationService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TelegrafContext>,
    private readonly config: ConfigService,
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
   * Отправить уведомление об отклонении заявки
   */
  async notifyAccessRequestDeclined(telegramId: string, adminNote?: string) {
    const message = `❌ Ваша заявка на доступ была отклонена${adminNote ? `\n\nПричина: ${adminNote}` : ''}`;
    return this.sendMessage(telegramId, message);
  }

  /**
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
   * Уведомить админа о новой заявке на доступ
   */
  async notifyAdminAccessRequest(user: any) {
    const adminId = '239676985';
    const message = `🚪 Запрос на доступ\nИмя: ${user.firstName || ''} ${user.lastName || ''}\nUsername: @${user.username || ''}\nTelegram ID: ${user.telegramId}`;
    try {
      await this.bot.telegram.sendMessage(adminId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Одобрить', callback_data: `approve_access:${user.telegramId}` },
              { text: 'Отклонить', callback_data: `decline_access:${user.telegramId}` },
            ],
          ],
        },
      });
    } catch (e) {
      console.error('Ошибка отправки уведомления админу:', e);
    }
  }
}
