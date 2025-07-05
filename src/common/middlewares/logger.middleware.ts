import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    Logger.log(
      ` Request ${req.method} ${req.originalUrl}  📨 ${req.body && JSON.stringify(req.body)}`,
    );
    next();
  }
}
