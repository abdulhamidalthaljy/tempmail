import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom"
    >
      <div class="container-fluid">
        <!-- Logo -->
        <a class="navbar-brand d-flex align-items-center" href="#">
          <h1 class="h3 mb-0 fw-bold">
            <span class="text-dark">Temp</span
            ><span class="text-primary">Mail</span>
          </h1>
          <small class="ms-3 text-muted d-none d-md-block">
            Disposable email addresses for temporary use
          </small>
        </a>

        <!-- Mobile toggle button -->
        <button
          class="navbar-toggler"
          type="button"
          (click)="toggleMobileMenu()"
          [attr.aria-expanded]="showMobileMenu"
          aria-controls="navbarNav"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation -->
        <div
          class="collapse navbar-collapse"
          [class.show]="showMobileMenu"
          id="navbarNav"
        >
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link text-secondary" href="#">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-secondary" href="#">About</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-secondary" href="#">FAQ</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar-brand:hover {
        text-decoration: none;
      }

      .nav-link:hover {
        color: var(--bs-primary) !important;
      }
    `,
  ],
})
export class HeaderComponent {
  showMobileMenu = false;

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
