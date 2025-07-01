// src/bot/utils.ts
import { Context } from 'telegraf';
import { Role } from '@prisma/client';

export function requireRole(ctx: Context, role: Role): boolean {
  const user = ctx.state.user;

  console.info('requireRole', ctx);

  if (!user || user.role !== role) {
    ctx.reply('❌ У вас нет прав для этой команды.');
    return false;
  }
  return true;
}
