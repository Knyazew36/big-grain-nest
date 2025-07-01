import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse() as Response;
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    this.logger.error(exception instanceof Error ? exception.stack : JSON.stringify(exception));

    response.status(status).json({
      message: typeof message === 'string' ? message : (message as any).message,
      exception: exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      status,
    });
  }
}
