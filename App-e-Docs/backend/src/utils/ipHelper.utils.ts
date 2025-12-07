import { Request } from "express";

export function getIpAddress(req: Request): string {
  const xForwardedFor = req.headers["x-forwarded-for"] as string;
  if (xForwardedFor) {
    return xForwardedFor.split(",").shift()?.trim() || "";
  }

  return req.socket.remoteAddress || "";
}
