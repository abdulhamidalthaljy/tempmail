import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../../services/email.service';
import { EmailMessage } from '../../models/email-message.model';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card border-radius-lg shadow-sm-custom">
      <div class="card-header bg-transparent border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h3 class="h5 fw-semibold text-dark mb-0">
            Inbox
            <span
              *ngIf="messages.length > 0"
              class="ms-2 small fw-normal text-muted"
            >
              ({{ messages.length }}
              {{ messages.length === 1 ? 'message' : 'messages' }})
            </span>
          </h3>

          <div class="d-flex align-items-center">
            <!-- Auto-refresh indicator -->
            <div class="d-flex align-items-center small text-muted">
              <div
                class="bg-success rounded-circle pulse-animation me-2"
                style="width: 8px; height: 8px;"
              ></div>
              Auto-refreshing
            </div>
          </div>
        </div>
      </div>

      <div class="card-body">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-4">
          <div class="d-inline-flex align-items-center">
            <div class="loading-spinner me-3"></div>
            Loading messages...
          </div>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!isLoading && messages.length === 0"
          class="text-center py-5"
        >
          <div
            class="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
            style="width: 64px; height: 64px;"
          >
            <svg
              class="text-muted"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <h4 class="h6 fw-medium text-dark mb-2">No messages yet</h4>
          <p class="text-muted">
            Messages sent to your temporary email will appear here
            automatically.
          </p>
        </div>

        <!-- Messages List -->
        <div *ngIf="!isLoading && messages.length > 0" class="d-grid gap-3">
          <div
            *ngFor="let message of messages; trackBy: trackByMessageId"
            class="border rounded p-3 hover-bg-light transition-colors"
            [class.bg-primary-subtle]="selectedMessage?.id === message.id"
            [class.border-primary]="selectedMessage?.id === message.id"
            [class.bg-light]="!message.isRead"
            (click)="selectMessage(message)"
            style="cursor: pointer;"
          >
            <div class="d-flex align-items-start justify-content-between">
              <div class="flex-grow-1 min-width-0">
                <!-- Sender -->
                <div class="d-flex align-items-center mb-1">
                  <span class="small fw-medium text-dark text-truncate">
                    {{ message.from }}
                  </span>
                  <span
                    *ngIf="!message.isRead"
                    class="ms-2 bg-primary rounded-circle"
                    style="width: 8px; height: 8px;"
                  ></span>
                </div>

                <!-- Subject -->
                <h6 class="fw-medium text-dark text-truncate mb-1">
                  {{ message.subject || '(No Subject)' }}
                </h6>

                <!-- Preview -->
                <p class="small text-muted mb-0 line-clamp-2">
                  {{ getMessagePreview(message) }}
                </p>
              </div>

              <!-- Timestamp -->
              <div class="ms-3 flex-shrink-0 text-end">
                <span class="small text-muted">
                  {{ formatDate(message.receivedAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage" class="mt-4 alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <!-- Email Viewer Modal/Panel -->
    <!-- Email Viewer Modal/Panel -->
    <div *ngIf="selectedMessage" class="mt-4">
      <div class="card">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <h5 class="mb-0">{{ selectedMessage.subject || '(No Subject)' }}</h5>
          <button
            type="button"
            class="btn-close"
            (click)="closeViewer()"
          ></button>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <strong>From:</strong> {{ selectedMessage.from }}<br />
            <strong>Date:</strong> {{ formatDate(selectedMessage.receivedAt) }}
          </div>
          <div [innerHTML]="selectedMessage.body"></div>

          <!-- SMTP Action Buttons -->
          <div class="mt-4 d-flex gap-2">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              (click)="showReplyForm()"
              [disabled]="isProcessingSMTP"
            >
              <i class="bi bi-reply"></i> Reply
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              (click)="showForwardForm()"
              [disabled]="isProcessingSMTP"
            >
              <i class="bi bi-arrow-right"></i> Forward
            </button>
          </div>

          <!-- Reply Form -->
          <div *ngIf="showReply" class="mt-4 border-top pt-4">
            <h6>Reply to: {{ selectedMessage.from }}</h6>
            <form (ngSubmit)="sendReply()" #replyForm="ngForm">
              <div class="mb-3">
                <label for="replySubject" class="form-label">Subject</label>
                <input
                  type="text"
                  class="form-control"
                  id="replySubject"
                  [(ngModel)]="replyData.subject"
                  name="replySubject"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="replyMessage" class="form-label">Message</label>
                <textarea
                  class="form-control"
                  id="replyMessage"
                  rows="5"
                  [(ngModel)]="replyData.message"
                  name="replyMessage"
                  required
                ></textarea>
              </div>
              <div class="d-flex gap-2">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="isProcessingSMTP || !replyForm.valid"
                >
                  <span
                    *ngIf="isProcessingSMTP"
                    class="spinner-border spinner-border-sm me-2"
                  ></span>
                  Send Reply
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="cancelReply()"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <!-- Forward Form -->
          <div *ngIf="showForward" class="mt-4 border-top pt-4">
            <h6>Forward message</h6>
            <form (ngSubmit)="sendForward()" #forwardForm="ngForm">
              <div class="mb-3">
                <label for="forwardTo" class="form-label">To</label>
                <input
                  type="email"
                  class="form-control"
                  id="forwardTo"
                  [(ngModel)]="forwardData.to"
                  name="forwardTo"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="forwardSubject" class="form-label">Subject</label>
                <input
                  type="text"
                  class="form-control"
                  id="forwardSubject"
                  [(ngModel)]="forwardData.subject"
                  name="forwardSubject"
                />
              </div>
              <div class="mb-3">
                <label for="forwardMessage" class="form-label"
                  >Additional Message (Optional)</label
                >
                <textarea
                  class="form-control"
                  id="forwardMessage"
                  rows="3"
                  [(ngModel)]="forwardData.message"
                  name="forwardMessage"
                  placeholder="Add your message here..."
                ></textarea>
              </div>
              <div class="d-flex gap-2">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="isProcessingSMTP || !forwardForm.valid"
                >
                  <span
                    *ngIf="isProcessingSMTP"
                    class="spinner-border spinner-border-sm me-2"
                  ></span>
                  Forward
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="cancelForward()"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class InboxComponent implements OnInit, OnDestroy {
  @Input() emailAddress!: string;

  messages: EmailMessage[] = [];
  selectedMessage: EmailMessage | null = null;
  isLoading = false;
  errorMessage = '';

  // SMTP functionality
  showReply = false;
  showForward = false;
  isProcessingSMTP = false;

  replyData = {
    subject: '',
    message: '',
  };

  forwardData = {
    to: '',
    subject: '',
    message: '',
  };

  constructor(private emailService: EmailService) {}

  ngOnInit(): void {
    if (this.emailAddress) {
      this.loadMessages();

      // Subscribe to messages updates
      this.emailService.messages$.subscribe((messages) => {
        this.messages = messages.sort(
          (a, b) =>
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
      });
    }
  }

  ngOnDestroy(): void {
    // Component cleanup is handled by the service
  }

  loadMessages(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.emailService.getMessages(this.emailAddress).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      },
    });
  }

  selectMessage(message: EmailMessage): void {
    this.selectedMessage = message;

    // Mark as read if not already read
    if (!message.isRead) {
      this.emailService
        .markMessageAsRead(this.emailAddress, message.messageId)
        .subscribe({
          next: () => {
            message.isRead = true;
          },
          error: (error) => {
            console.error('Failed to mark message as read:', error);
          },
        });
    }
  }

  closeViewer(): void {
    this.selectedMessage = null;
  }

  onMarkAsRead(messageId: string): void {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) {
      message.isRead = true;
    }
  }

  getMessagePreview(message: EmailMessage): string {
    // Strip HTML tags and get first 100 characters
    const textContent = message.body.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 100
      ? textContent.substring(0, 100) + '...'
      : textContent;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  trackByMessageId(index: number, message: EmailMessage): string {
    return message.id;
  }

  // SMTP Methods
  showReplyForm(): void {
    if (this.selectedMessage) {
      this.showReply = true;
      this.showForward = false;
      this.replyData.subject = `Re: ${
        this.selectedMessage.subject || '(No Subject)'
      }`;
      this.replyData.message = '';
    }
  }

  showForwardForm(): void {
    if (this.selectedMessage) {
      this.showForward = true;
      this.showReply = false;
      this.forwardData.subject = `Fwd: ${
        this.selectedMessage.subject || '(No Subject)'
      }`;
      this.forwardData.to = '';
      this.forwardData.message = '';
    }
  }

  sendReply(): void {
    if (!this.selectedMessage) return;

    this.isProcessingSMTP = true;

    this.emailService
      .replyToMessage(
        this.emailAddress,
        this.selectedMessage.messageId,
        this.replyData
      )
      .subscribe({
        next: (response) => {
          console.log('Reply sent successfully:', response);
          this.cancelReply();
          this.isProcessingSMTP = false;
          // You could show a success message here
        },
        error: (error) => {
          console.error('Failed to send reply:', error);
          this.isProcessingSMTP = false;
          this.errorMessage = 'Failed to send reply. Please try again.';
        },
      });
  }

  sendForward(): void {
    if (!this.selectedMessage) return;

    this.isProcessingSMTP = true;

    this.emailService
      .forwardMessage(
        this.emailAddress,
        this.selectedMessage.messageId,
        this.forwardData
      )
      .subscribe({
        next: (response) => {
          console.log('Message forwarded successfully:', response);
          this.cancelForward();
          this.isProcessingSMTP = false;
          // You could show a success message here
        },
        error: (error) => {
          console.error('Failed to forward message:', error);
          this.isProcessingSMTP = false;
          this.errorMessage = 'Failed to forward message. Please try again.';
        },
      });
  }

  cancelReply(): void {
    this.showReply = false;
    this.replyData = { subject: '', message: '' };
  }

  cancelForward(): void {
    this.showForward = false;
    this.forwardData = { to: '', subject: '', message: '' };
  }
}
