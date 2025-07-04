import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
// import { AllExceptionsFilter } from './common/filters/exception.filter';
// import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/fitlers/exception.filter';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      process.env.WEBAPP_URL,
      'https://big-grain-tg.vercel.app',
      'https://front-test.devmill.ru',
    ], // Явно указываем разрешённый origin
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  // const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  // app.useLogger(winstonLogger);
  // app.use(cookieParser());
  //swagger
  // const config = new DocumentBuilder()
  // .setTitle('Bitrix24')
  // .setDescription('The cats API description')
  // .setVersion('1.0')
  // .addTag('bitrix')
  // .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, documentFactory);

  // app.useGlobalInterceptors(new ResponseInterceptor());
  // app.useGlobalInterceptors(new DbStatusInterceptor(app.get('PrismaService')));
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true, // Удаляет неописанные в DTO поля
      // forbidNonWhitelisted: true, // Ошибка при передаче неописанных полей
      transform: true, // Автоматически преобразует входные данные к типу DTO
    }),
  );

  app.listen(53428);
}
bootstrap();
