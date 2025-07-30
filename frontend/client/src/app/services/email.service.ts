import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  throwError,
  BehaviorSubject,
  timer,
  switchMap,
} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  TempEmail,
  CreateTempEmailRequest,
  CreateTempEmailResponse,
} from '../models/temp-email.model';
import {
  EmailMessage,
  GetMessagesResponse,
  GetMessageResponse,
} from '../models/email-message.model';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly API_URL = 'http://localhost:3000/api';
  private currentEmailSubject = new BehaviorSubject<TempEmail | null>(null);
  private messagesSubject = new BehaviorSubject<EmailMessage[]>([]);
  private autoRefreshSubscription: any;

  public currentEmail$ = this.currentEmailSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Generate a new temporary email address
   */
  generateTempEmail(
    request: CreateTempEmailRequest = {}
  ): Observable<TempEmail> {
    return this.http
      .post<CreateTempEmailResponse>(`${this.API_URL}/email/new`, request)
      .pipe(
        map((response) => {
          if (response.success) {
            const email = {
              ...response.data,
              createdAt: new Date(response.data.createdAt),
              expiresAt: new Date(response.data.expiresAt),
            };
            this.currentEmailSubject.next(email);
            this.startAutoRefresh(email.address);
            return email;
          }
          throw new Error(response.error || 'Failed to generate email');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get messages for a specific email address
   */
  getMessages(emailAddress: string): Observable<EmailMessage[]> {
    return this.http
      .get<GetMessagesResponse>(
        `${this.API_URL}/email/${emailAddress}/messages`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            const messages = response.data.messages.map((msg) => ({
              ...msg,
              receivedAt: new Date(msg.receivedAt),
            }));
            this.messagesSubject.next(messages);
            return messages;
          }
          throw new Error(response.error || 'Failed to fetch messages');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a specific message by ID
   */
  getMessage(
    emailAddress: string,
    messageId: string
  ): Observable<EmailMessage> {
    return this.http
      .get<GetMessageResponse>(
        `${this.API_URL}/email/${emailAddress}/message/${messageId}`
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return {
              ...response.data,
              receivedAt: new Date(response.data.receivedAt),
            };
          }
          throw new Error(response.error || 'Failed to fetch message');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mark a message as read
   */
  markMessageAsRead(
    emailAddress: string,
    messageId: string
  ): Observable<boolean> {
    return this.http
      .put<{ success: boolean }>(
        `${this.API_URL}/email/${emailAddress}/message/${messageId}/read`,
        {}
      )
      .pipe(
        map((response) => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Add a mock email for testing purposes
   */
  addMockEmail(
    emailAddress: string,
    mockEmail: {
      from: string;
      subject: string;
      body: string;
    }
  ): Observable<any> {
    return this.http
      .post<{ success: boolean; data: any }>(
        `${this.API_URL}/email/${emailAddress}/mock-message`,
        mockEmail
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error('Failed to add mock email');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Reply to a message using real SMTP
   */
  replyToMessage(
    emailAddress: string,
    messageId: string,
    replyData: {
      subject: string;
      message: string;
    }
  ): Observable<any> {
    return this.http
      .post<{ success: boolean; data: any }>(
        `${this.API_URL}/email/${emailAddress}/reply/${messageId}`,
        replyData
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error('Failed to send reply');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Forward a message using real SMTP
   */
  forwardMessage(
    emailAddress: string,
    messageId: string,
    forwardData: {
      to: string;
      subject?: string;
      message?: string;
    }
  ): Observable<any> {
    return this.http
      .post<{ success: boolean; data: any }>(
        `${this.API_URL}/email/${emailAddress}/forward/${messageId}`,
        forwardData
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error('Failed to forward message');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Send a new email using real SMTP
   */
  sendEmail(
    emailAddress: string,
    emailData: {
      to: string;
      subject: string;
      text: string;
      html?: string;
    }
  ): Observable<any> {
    return this.http
      .post<{ success: boolean; data: any }>(
        `${this.API_URL}/email/${emailAddress}/send`,
        emailData
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error('Failed to send email');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verify SMTP connection
   */
  verifySMTPConnection(): Observable<any> {
    return this.http
      .get<{ success: boolean; data: any }>(`${this.API_URL}/email/smtp/verify`)
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error('Failed to verify SMTP connection');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Start auto-refresh for messages every 15 seconds
   */
  startAutoRefresh(emailAddress: string): void {
    this.stopAutoRefresh();
    this.autoRefreshSubscription = timer(0, 15000)
      .pipe(switchMap(() => this.getMessages(emailAddress)))
      .subscribe();
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }
  }

  /**
   * Get current email address
   */
  getCurrentEmail(): TempEmail | null {
    return this.currentEmailSubject.value;
  }

  /**
   * Get current messages
   */
  getCurrentMessages(): EmailMessage[] {
    return this.messagesSubject.value;
  }

  /**
   * Calculate time remaining until email expires
   */
  getTimeRemaining(email: TempEmail): {
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } {
    const now = new Date().getTime();
    const expiry = email.expiresAt.getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, expired: false };
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.currentEmailSubject.complete();
    this.messagesSubject.complete();
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage =
        error.error?.message ||
        `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('EmailService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
