export interface ValidateRequest {
  app_id: string;
  license_key: string;
  hwid: string;
}

export interface ValidateResponse {
  valid: boolean;
  message: string;
  expires_at?: number;
  session_id?: string;
}

export interface JWTUser {
  email: string;
  user_id?: number;
  iat?: number;
  exp?: number;
}

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: JWTUser;
    }
  }
}