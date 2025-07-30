import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../../services/email.service';
import { TempEmail } from '../../models/temp-email.model';
import { InboxComponent } from '../inbox/inbox.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, InboxComponent],
  template: `
    <div class="min-vh-100 bg-light py-5">
      <div class="container">
        <!-- Hero Section -->
        <div class="text-center mb-5">
          <h1 class="display-4 fw-bold text-dark mb-4">
            Temporary Email Address
          </h1>
          <p class="lead text-muted mb-5 mx-auto" style="max-width: 600px;">
            Get a disposable email address that will self-destruct after one
            hour. Perfect for signups, downloads, and protecting your privacy.
          </p>
        </div>

        <!-- Email Generation Section -->
        <div
          class="card border-radius-lg shadow-sm-custom mb-5 animate-fade-in"
        >
          <div class="card-body text-center">
            <h2 class="h3 fw-semibold text-dark mb-4">Your Temporary Email</h2>

            <!-- Current Email Display -->
            <div *ngIf="currentEmail" class="mb-4">
              <div class="email-display mb-3">
                <div
                  class="d-flex align-items-center justify-content-center flex-wrap gap-3"
                >
                  <span class="text-break">
                    {{ currentEmail.address }}
                  </span>
                  <button
                    (click)="copyEmailToClipboard()"
                    class="btn btn-secondary btn-sm me-2"
                    [disabled]="copyButtonText !== 'Copy'"
                  >
                    {{ copyButtonText }}
                  </button>
                  <button
                    (click)="addMockEmail()"
                    class="btn btn-info btn-sm"
                    title="Add test email to inbox"
                  >
                    📧 Add Test Email
                  </button>
                </div>
              </div>

              <!-- Countdown Timer -->
              <div class="text-center mb-4">
                <div *ngIf="!timeRemaining.expired" class="small text-muted">
                  <span class="fw-medium">Expires in:</span>
                  <span class="countdown-timer ms-2">
                    {{ formatTime(timeRemaining) }}
                  </span>
                </div>
                <div
                  *ngIf="timeRemaining.expired"
                  class="small text-danger fw-medium"
                >
                  Email has expired
                </div>
              </div>
            </div>

            <!-- Generate Button -->
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <button
                (click)="generateNewEmail()"
                [disabled]="isGenerating"
                class="btn btn-primary"
              >
                <span *ngIf="!isGenerating">
                  {{ currentEmail ? 'Generate New Email' : 'Generate Email' }}
                </span>
                <span *ngIf="isGenerating" class="d-flex align-items-center">
                  <span class="loading-spinner me-2"></span>
                  Generating...
                </span>
              </button>

              <button
                *ngIf="currentEmail"
                (click)="refreshInbox()"
                [disabled]="isRefreshing"
                class="btn btn-secondary"
              >
                <span *ngIf="!isRefreshing">Refresh Inbox</span>
                <span *ngIf="isRefreshing">Refreshing...</span>
              </button>
            </div>

            <!-- Error Message -->
            <div
              *ngIf="errorMessage"
              class="alert alert-danger mt-4"
              role="alert"
            >
              {{ errorMessage }}
            </div>
          </div>
        </div>

        <!-- Inbox Section -->
        <div *ngIf="currentEmail" class="animate-slide-up">
          <app-inbox [emailAddress]="currentEmail.address"></app-inbox>
        </div>

        <!-- Features Section -->
        <div *ngIf="!currentEmail" class="row g-4 mt-5">
          <div class="col-md-4">
            <div class="text-center p-4">
              <div class="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
              </div>
              <h3 class="h5 fw-semibold text-dark mb-3">Private & Secure</h3>
              <p class="text-muted">
                Your temporary email is completely anonymous and secure.
              </p>
            </div>
          </div>

          <div class="col-md-4">
            <div class="text-center p-4">
              <div class="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h3 class="h5 fw-semibold text-dark mb-3">Auto-Expires</h3>
              <p class="text-muted">
                Emails automatically delete after 1 hour for your privacy.
              </p>
            </div>
          </div>

          <div class="col-md-4">
            <div class="text-center p-4">
              <div class="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 class="h5 fw-semibold text-dark mb-3">Instant Setup</h3>
              <p class="text-muted">
                Get your temporary email in seconds, no registration required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentEmail: TempEmail | null = null;
  isGenerating = false;
  isRefreshing = false;
  errorMessage = '';
  copyButtonText = 'Copy';
  timeRemaining = { hours: 0, minutes: 0, seconds: 0, expired: false };

  private countdownInterval: any;

  constructor(private emailService: EmailService) {}

  ngOnInit(): void {
    // Check for expired email on init
    this.emailService.checkAndCleanupExpiredEmail();

    // Subscribe to current email changes
    this.emailService.currentEmail$.subscribe((email) => {
      this.currentEmail = email;
      if (email) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  generateNewEmail(): void {
    this.isGenerating = true;
    this.errorMessage = '';

    this.emailService.generateTempEmail().subscribe({
      next: (email) => {
        this.currentEmail = email;
        this.isGenerating = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isGenerating = false;
      },
    });
  }

  refreshInbox(): void {
    if (!this.currentEmail) return;

    this.isRefreshing = true;
    this.emailService.getMessages(this.currentEmail.address).subscribe({
      next: () => {
        this.isRefreshing = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isRefreshing = false;
      },
    });
  }

  async copyEmailToClipboard(): Promise<void> {
    if (!this.currentEmail) return;

    const success = await this.emailService.copyToClipboard(
      this.currentEmail.address
    );
    if (success) {
      this.copyButtonText = 'Copied!';
      setTimeout(() => {
        this.copyButtonText = 'Copy';
      }, 2000);
    }
  }

  // For testing: Add a mock email to the inbox
  addMockEmail(): void {
    if (!this.currentEmail) return;

    const mockEmails = [
      {
        from: 'welcome@example.com',
        subject: 'Welcome to our service!',
        body: "Thank you for signing up. We're excited to have you on board!",
      },
      {
        from: 'newsletter@techblog.com',
        subject: 'Weekly Tech Newsletter',
        body: "Here are this week's top tech stories and tutorials.",
      },
      {
        from: 'support@shopping.com',
        subject: 'Your Order Confirmation #12345',
        body: 'Your order has been confirmed and will be shipped within 2-3 business days.',
      },
      {
        from: 'noreply@github.com',
        subject: 'Security Alert: New Device Sign-in',
        body: 'We detected a sign-in to your account from a new device.',
      },
    ];

    const randomEmail =
      mockEmails[Math.floor(Math.random() * mockEmails.length)];

    this.emailService
      .addMockEmail(this.currentEmail.address, randomEmail)
      .subscribe({
        next: () => {
          this.refreshInbox();
        },
        error: (error: any) => {
          this.errorMessage = 'Failed to add mock email';
        },
      });
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateCountdown(): void {
    if (this.currentEmail) {
      this.timeRemaining = this.emailService.getTimeRemaining(
        this.currentEmail
      );

      if (this.timeRemaining.expired) {
        this.stopCountdown();
        // Clear expired email
        this.emailService.clearCurrentEmail();
      }
    }
  }

  formatTime(time: {
    hours: number;
    minutes: number;
    seconds: number;
  }): string {
    const h = time.hours.toString().padStart(2, '0');
    const m = time.minutes.toString().padStart(2, '0');
    const s = time.seconds.toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
