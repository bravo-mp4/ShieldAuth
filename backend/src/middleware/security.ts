// Security Middleware
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting configurations
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      code: 'ERR_RATE_LIMIT_001'
    });
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true
});

export const licenseValidationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'License validation rate limit exceeded' }
});

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS Configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://shieldauth.com', 'https://www.shieldauth.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Admin role checker
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'ERR_AUTH_001' 
    });
  }

  // Check if user has admin role (you need to add this to your users table)
  // For now, checking if email matches admin email from env
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ 
      error: 'Forbidden - Admin access required', 
      code: 'ERR_AUTH_003' 
    });
  }

  next();
};

// Audit log middleware
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data) {
      // Log the action
      if (req.user) {
        // You'll need to create an audit_logs table
        console.log('[AUDIT]', {
          timestamp: new Date().toISOString(),
          user: req.user.email,
          action,
          ip: req.ip,
          status: res.statusCode
        });
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

export default {
  apiLimiter,
  authLimiter,
  licenseValidationLimiter,
  securityHeaders,
  corsOptions,
  requireAdmin,
  auditLog
};
