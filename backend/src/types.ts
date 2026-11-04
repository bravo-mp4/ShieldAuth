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

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

// Extend Express Request type to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
