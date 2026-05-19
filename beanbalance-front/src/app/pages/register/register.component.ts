import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, NgStyle],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private router = inject(Router);
  private state = inject(AppStateService);
  private authApi = inject(AuthApiService);

  username = signal('');
  email = signal('');
  password = signal('');
  errors = signal<Record<string, string>>({});
  focused = signal<Record<string, boolean>>({});
  submitHovered = signal(false);
  isLoading = signal(false);

  submitBtnStyle = computed(() => ({
    width: '100%',
    background: this.submitHovered() ? '#e0e0e0' : '#ffffff',
    border: '1px solid #ffffff',
    color: '#000000',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: '13px',
    padding: '10px 0',
    cursor: 'pointer',
    letterSpacing: '0.15em',
  }));

  inputStyle(field: string) {
    const hasFocus = !!this.focused()[field];
    const hasError = !!this.errors()[field];
    return {
      width: '100%',
      boxSizing: 'border-box',
      background: '#0a0a0a',
      border: `1px solid ${hasFocus || hasError ? '#ffffff' : '#2a2a2a'}`,
      color: '#ffffff',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: '13px',
      padding: '8px 10px',
      outline: 'none',
      letterSpacing: '0.04em',
      transition: 'border-color 100ms',
    };
  }

  focus(field: string) {
    this.focused.update(f => ({ ...f, [field]: true }));
  }

  blur(field: string) {
    this.focused.update(f => ({ ...f, [field]: false }));
  }

  validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (this.username().length < 3) e['username'] = 'USERNAME MUST BE AT LEAST 3 CHARACTERS';
    if (!this.email().includes('@')) e['email'] = 'INVALID EMAIL ADDRESS';
    if (this.password().length < 6) e['password'] = 'PASSWORD MUST BE AT LEAST 6 CHARACTERS';
    return e;
  }

  handleSubmit(e: Event) {
    e.preventDefault();
    const errs = this.validate();
    if (Object.keys(errs).length > 0) {
      this.errors.set(errs);
      return;
    }
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.authApi.register(this.username(), this.email(), this.password()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        const message = err.status === 409 ? 'EMAIL OR USERNAME ALREADY IN USE' : 'REGISTRATION FAILED';
        this.state.showToast('error', message);
        this.isLoading.set(false);
      },
    });
  }
}
