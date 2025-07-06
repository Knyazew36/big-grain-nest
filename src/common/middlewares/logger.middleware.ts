import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    Logger.log(
      ` Request ${req.method} originalUrl: ${req.originalUrl}  body: ${req.body && JSON.stringify(req.body)} `,
      // ` Request ${req.method} originalUrl: ${req.originalUrl}  body: ${req.body && JSON.stringify(req.body)} headers authorization: ${req.headers.authorization && JSON.stringify(req.headers.authorization)}`,
    );
    next();
  }
}
