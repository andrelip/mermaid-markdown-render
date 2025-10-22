/**
 * Security Middleware
 * Handles all security headers and CSP configuration
 * Refactoring: Extract Function + Single Responsibility Principle
 */

import type { Request, Response, NextFunction } from "express";
import { SECURITY_HEADERS } from "../config";

/**
 * Applies security headers to protect against XSS, clickjacking, and other attacks
 * - Content Security Policy (CSP) to prevent inline script execution
 * - X-Frame-Options to prevent clickjacking
 * - Other standard security headers
 */
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Content Security Policy - STRICT: No inline scripts or styles allowed
  res.setHeader(
    "Content-Security-Policy",
    SECURITY_HEADERS.CONTENT_SECURITY_POLICY,
  );

  // Additional security headers
  res.setHeader(
    "X-Content-Type-Options",
    SECURITY_HEADERS.X_CONTENT_TYPE_OPTIONS,
  );
  res.setHeader("X-Frame-Options", SECURITY_HEADERS.X_FRAME_OPTIONS);
  res.setHeader("X-XSS-Protection", SECURITY_HEADERS.X_XSS_PROTECTION);
  res.setHeader("Referrer-Policy", SECURITY_HEADERS.REFERRER_POLICY);

  next();
}
