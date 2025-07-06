<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Environment Variables

Создайте файл `.env` в корне проекта со следующими переменными:

```env
# Environment
NODE_ENV=development

# Telegram Bot Tokens
TG_BOT_TOKEN=your_production_bot_token_here
TG_BOT_TOKEN_DEV=your_development_bot_token_here

# Other environment variables can be added here
```

### Описание переменных

- `NODE_ENV` - Окружение приложения (`development` или `production`)
- `TG_BOT_TOKEN` - Токен бота для production окружения
- `TG_BOT_TOKEN_DEV` - Токен бота для development окружения

**Важно:** В development режиме используется `TG_BOT_TOKEN_DEV`, в production - `TG_BOT_TOKEN`.

### Кроссплатформенная поддержка

Проект использует `cross-env` для корректной работы с переменными окружения на всех платформах (Windows, macOS, Linux).

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

# Big Grain Nest

## Автоматическое включение роли пользователя в ответы

Начиная с версии X.X.X, все API ответы автоматически включают информацию о пользователе, если он аутентифицирован через Telegram.

### Структура ответа

```json
{
  "status": "success",
  "data": { /* ваши данные */ },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "user": {
    "id": 1,
    "role": "OPERATOR",
    "telegramId": "123456789"
  }
}
```

### Исключение информации о пользователе

Если вы хотите исключить информацию о пользователе из конкретного эндпоинта, используйте декоратор `@ExcludeUserInfo()`:

```typescript
import { ExcludeUserInfo } from 'src/auth/interceptors/response.interceptor';

@Controller('products')
export class ProductsController {
  @Get()
  @ExcludeUserInfo() // Исключает информацию о пользователе из ответа
  findAll() {
    return this.productsService.findAll();
  }
}
```

### Доступные роли

- `GUEST` - Гость (по умолчанию)
- `OPERATOR` - Оператор
- `ADMIN` - Администратор
