import axios, { AxiosInstance } from 'axios';
import { getHWID } from './hwid';
import { ValidateRequest, ValidateResponse, ShieldAuthOptions } from './types';

export class ShieldAuth {
  private appId: string;
  private sessionId: string | null = null;
  private isValidFlag: boolean = false;
  private client: AxiosInstance;
  
  constructor(appId: string, options: ShieldAuthOptions = {}) {
    if (!appId) {
      throw new Error('App ID cannot be empty');
    }
    
    this.appId = appId;
    
    this.client = axios.create({
      baseURL: options.apiUrl || 'https://api.shieldauth.com/api/v1',
      timeout: options.timeout || 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  async validate(licenseKey: string): Promise<boolean> {
    try {
      const hwid = getHWID();
      
      const response = await this.client.post<ValidateResponse>('/validate', {
        app_id: this.appId,
        license_key: licenseKey,
        hwid
      });
      
      this.isValidFlag = response.data.valid;
      
      if (this.isValidFlag) {
        this.sessionId = response.data.session_id || null;
      }
      
      return this.isValidFlag;
      
    } catch (error) {
      console.error('ShieldAuth validation error:', error);
      return false;
    }
  }
  
  async heartbeat(): Promise<boolean> {
    if (!this.sessionId) {
      return false;
    }
    
    try {
      const response = await this.client.post('/heartbeat', {
        session_id: this.sessionId
      });
      
      return response.status === 200;
    } catch {
      return false;
    }
  }
  
  isValid(): boolean {
    return this.isValidFlag;
  }
  
  getSessionId(): string | null {
    return this.sessionId;
  }
  
  static getHWID(): string {
    return getHWID();
  }
}