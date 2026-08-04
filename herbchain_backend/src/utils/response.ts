import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
  requestId?: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  errors?: any
) => {
  const response: ApiResponse<T> = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) response.data = data;
  if (errors !== undefined) response.errors = errors;

  return res.status(statusCode).json(response);
};
