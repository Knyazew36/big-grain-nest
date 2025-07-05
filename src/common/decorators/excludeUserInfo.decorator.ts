import { SetMetadata } from '@nestjs/common';

// Декоратор для исключения информации о пользователе
export const EXCLUDE_USER_INFO = 'excludeUserInfo';
export const ExcludeUserInfo = () => SetMetadata(EXCLUDE_USER_INFO, true);
