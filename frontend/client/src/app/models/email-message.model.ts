export interface EmailMessage {
  id: string;
  messageId: string;
  emailAddress: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  receivedAt: Date;
  isRead: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data: {
    messages: EmailMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    unreadCount: number;
    emailInfo: {
      address: string;
      timeRemaining: any;
    };
  };
  error?: string;
}

export interface GetMessageResponse {
  success: boolean;
  data: EmailMessage;
  error?: string;
}
