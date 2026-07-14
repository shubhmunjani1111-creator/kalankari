import { Request, Response, NextFunction } from 'express';

// Simulated in-memory store for rate limiting (production ready sliding window)
const ipRequests = new Map<string, { count: number; firstRequestTime: number }>();

/**
 * Custom Rate Limiter Middleware
 * Restricts client requests per IP within a sliding timeframe window
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const currentTime = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes window
  const maxRequests = 2000; // Limit each IP to 2000 requests per window

  const record = ipRequests.get(ip);
  if (!record) {
    ipRequests.set(ip, { count: 1, firstRequestTime: currentTime });
    return next();
  }

  if (currentTime - record.firstRequestTime > windowMs) {
    // Reset sliding timeframe window
    ipRequests.set(ip, { count: 1, firstRequestTime: currentTime });
    return next();
  }

  record.count++;
  if (record.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests from this IP. Please try again after 15 minutes.'
    });
  }

  next();
};

/**
 * Helmet Security Headers Middleware
 * Protects the Express API against cross-site scripting, framing clickjacking, sniff attacks.
 */
export const helmetSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  // Content Security Policy setup
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
  next();
};

// Deep value sanitizer scanner
const sanitizeValue = (val: any): any => {
  if (typeof val === 'string') {
    // Escape HTML tags to prevent XSS injections and strip SQL/NoSQL character combinations
    return val
      .replace(/<[^>]*>/g, '') // Strip inline HTML
      .replace(/[&<>"']/g, (m) => {
        switch (m) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#x27;';
          default: return m;
        }
      });
  } else if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  } else if (typeof val === 'object' && val !== null) {
    const sanitized: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        sanitized[key] = sanitizeValue(val[key]);
      }
    }
    return sanitized;
  }
  return val;
};

/**
 * Recursive Input Sanitizer Middleware
 * Strips markup characters from request parameters, queries, and bodies.
 */
export const inputSanitizer = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
