import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { sendResponse } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);

  const statusCode = err.status || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  sendResponse(res, statusCode, false, message, undefined, err.errors || err.message);
};
