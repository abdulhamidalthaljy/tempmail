export interface TempEmail {
  id?: string;
  address: string;
  domain: string;
  createdAt: Date;
  expiresAt: Date;
  isActive?: boolean;
  messageCount?: number;
  timeRemaining?: {
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  };
}

export interface CreateTempEmailRequest {
  domain?: string;
  username?: string;
}

export interface CreateTempEmailResponse {
  success: boolean;
  data: TempEmail;
  error?: string;
}
