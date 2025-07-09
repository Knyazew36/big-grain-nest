import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { EXCLUDE_USER_INFO } from 'src/common/decorators/excludeUserInfo.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Проверяем, является ли это контекстом Telegraf
    if ((context.getType() as string) === 'telegraf') {
      return next.handle(); // не оборачиваем ответ для Telegram-бота
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Пользователь добавляется TelegramAuthGuard

    // Проверяем, нужно ли исключить информацию о пользователе
    const excludeUserInfo = this.reflector.getAllAndOverride<boolean>(EXCLUDE_USER_INFO, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((data) => {
        const response: any = {
          status: 'success',
          data,
          timestamp: new Date().toISOString(),
        };

        // Добавляем информацию о пользователе, если он аутентифицирован и не исключен
        if (user && !excludeUserInfo) {
          response.user = {
            id: user.id,
            role: user.role,
            telegramId: user.telegramId,
          };
        }

        return response;
      }),
    );
  }
}
