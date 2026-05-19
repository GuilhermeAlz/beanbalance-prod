import { Injectable, inject, signal } from '@angular/core';
import { Toast } from '../models/app.models';
import { AuthStorageService } from './auth-storage.service';

// Helpers

export function formatBRL(value: number): string {
  return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

// Service

@Injectable({ providedIn: 'root' })
export class AppStateService {

  private readonly storage = inject(AuthStorageService);

  readonly isLoggedIn = signal(this.storage.hasTokens());
  readonly username   = signal(this.storage.getUsername() ?? '');
  readonly toasts     = signal<Toast[]>([]);

  // Auth

  login(name: string): void {
    this.username.set(name);
    this.isLoggedIn.set(true);
  }

  logout(): void {
    this.isLoggedIn.set(false);
  }

  // Toasts

  showToast(type: 'success' | 'error', message: string): void {
    const id = Date.now().toString();
    this.toasts.update(prev => [...prev, { id, type, message }]);
    setTimeout(() => this.toasts.update(prev => prev.filter(t => t.id !== id)), 4000);
  }

  dismissToast(id: string): void {
    this.toasts.update(prev => prev.filter(t => t.id !== id));
  }
}

