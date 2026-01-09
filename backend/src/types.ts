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