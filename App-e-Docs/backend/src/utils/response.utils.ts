import { Response } from "express";

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  metadata?: any;
}

export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200,
  metadata: any = null
): Response => {
  const response: ApiResponse = {
    success: true,
    message,
  };

  if (data !== null) response.data = data;
  if (metadata !== null) response.metadata = metadata;

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = "Internal Server Error",
  statusCode: number = 500,
  errorRaw?: any // Opsional: untuk debugging error asli (console log)
): Response => {
  if (errorRaw) {
    console.error(`[ERROR]: ${message}`, errorRaw);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
