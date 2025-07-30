import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmailMessage } from '../../models/email-message.model';

@Component({
  selector: 'app-email-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border-radius-lg shadow-sm-custom">
      <!-- Header -->
      <div class="card-header bg-transparent border-bottom">
        <div class="d-flex align-items-center justify-content-between">
          <h3 class="h5 fw-semibold text-dark mb-0">Email Details</h3>
          <button
            (click)="onClose()"
            class="btn btn-link text-muted p-0"
            type="button"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Email Metadata -->
        <div class="mb-4">
          <div class="row g-3 mb-3">
            <!-- From -->
            <div class="col-md-6">
              <label class="form-label small fw-medium text-dark">From</label>
              <div
                class="form-control-plaintext bg-light rounded p-2 small text-break"
              >
                {{ message.from }}
              </div>
            </div>

            <!-- To -->
            <div class="col-md-6">
              <label class="form-label small fw-medium text-dark">To</label>
              <div
                class="form-control-plaintext bg-light rounded p-2 small text-break"
              >
                {{ message.to }}
              </div>
            </div>
          </div>

          <!-- Subject -->
          <div class="mb-3">
            <label class="form-label small fw-medium text-dark">Subject</label>
            <div class="form-control-plaintext bg-light rounded p-2 small">
              {{ message.subject || '(No Subject)' }}
            </div>
          </div>

          <!-- Received Date -->
          <div class="mb-3">
            <label class="form-label small fw-medium text-dark">Received</label>
            <div class="small text-muted">
              {{ formatFullDate(message.receivedAt) }}
            </div>
          </div>

          <!-- Attachments -->
          <div
            *ngIf="message.attachments && message.attachments.length > 0"
            class="mb-3"
          >
            <label class="form-label small fw-medium text-dark">
              Attachments ({{ message.attachments.length }})
            </label>
            <div class="d-grid gap-2">
              <div
                *ngFor="let attachment of message.attachments"
                class="d-flex align-items-center justify-content-between p-3 bg-light rounded border"
              >
                <div class="d-flex align-items-center">
                  <div
                    class="bg-primary-subtle rounded d-flex align-items-center justify-content-center me-3"
                    style="width: 32px; height: 32px;"
                  >
                    <svg
                      class="text-primary"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <div class="small fw-medium text-dark">
                      {{ attachment.filename }}
                    </div>
                    <div class="small text-muted">
                      {{ formatFileSize(attachment.size) }}
                    </div>
                  </div>
                </div>
                <button
                  *ngIf="attachment.downloadUrl"
                  (click)="downloadAttachment(attachment)"
                  class="btn btn-link btn-sm text-primary p-0"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Content -->
        <div class="border-top pt-4">
          <label class="form-label small fw-medium text-dark mb-3"
            >Message</label
          >

          <!-- Content Type Tabs -->
          <div *ngIf="message.bodyHtml" class="d-flex gap-2 mb-3">
            <button
              (click)="contentType = 'html'"
              [class.btn-primary]="contentType === 'html'"
              [class.btn-outline-secondary]="contentType !== 'html'"
              class="btn btn-sm"
              type="button"
            >
              HTML
            </button>
            <button
              (click)="contentType = 'text'"
              [class.btn-primary]="contentType === 'text'"
              [class.btn-outline-secondary]="contentType !== 'text'"
              class="btn btn-sm"
              type="button"
            >
              Plain Text
            </button>
          </div>

          <!-- HTML Content -->
          <div
            *ngIf="contentType === 'html' && message.bodyHtml"
            class="border rounded p-3 bg-white overflow-auto"
            style="max-height: 400px;"
            [innerHTML]="getSafeHtml(message.bodyHtml)"
          ></div>

          <!-- Plain Text Content -->
          <div
            *ngIf="contentType === 'text' || !message.bodyHtml"
            class="border rounded p-3 bg-light overflow-auto"
            style="max-height: 400px;"
          >
            <pre
              class="mb-0 small text-dark font-family-sans-serif"
              style="white-space: pre-wrap;"
              >{{ message.body }}</pre
            >
          </div>
        </div>

        <!-- Actions -->
        <div
          class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
        >
          <div class="d-flex align-items-center gap-2">
            <span *ngIf="!message.isRead" class="badge bg-primary">
              Unread
            </span>
            <span *ngIf="message.isRead" class="badge bg-secondary">
              Read
            </span>
          </div>

          <div class="d-flex gap-2">
            <button
              *ngIf="!message.isRead"
              (click)="onMarkAsRead()"
              class="btn btn-secondary btn-sm"
            >
              Mark as Read
            </button>
            <button (click)="onClose()" class="btn btn-primary btn-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Sanitize HTML content styles */
      :host ::ng-deep .email-content {
        font-family: inherit;
        line-height: 1.6;
      }

      :host ::ng-deep .email-content img {
        max-width: 100%;
        height: auto;
      }

      :host ::ng-deep .email-content a {
        color: #2563eb;
        text-decoration: underline;
      }

      :host ::ng-deep .email-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
      }

      :host ::ng-deep .email-content td,
      :host ::ng-deep .email-content th {
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
        text-align: left;
      }
    `,
  ],
})
export class EmailViewerComponent {
  @Input() message!: EmailMessage;
  @Input() emailAddress!: string;
  @Output() close = new EventEmitter<void>();
  @Output() markAsRead = new EventEmitter<string>();

  contentType: 'html' | 'text' = 'html';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Default to text if no HTML content
    if (!this.message.bodyHtml) {
      this.contentType = 'text';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onMarkAsRead(): void {
    this.markAsRead.emit(this.message.id);
  }

  getSafeHtml(html: string): SafeHtml {
    // Basic sanitization - in production, consider using a more robust solution
    const sanitizedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers

    return this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
  }

  formatFullDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadAttachment(attachment: any): void {
    if (attachment.downloadUrl) {
      window.open(attachment.downloadUrl, '_blank');
    }
  }
}
