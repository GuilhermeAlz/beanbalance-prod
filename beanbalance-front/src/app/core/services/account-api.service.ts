import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account, AccountType } from '../models/app.models';
import { AppStateService } from './app-state.service';

// Spring serialises the enum name: CREDIT_CARD — Angular model uses 'CREDIT_CARD'
// (model was updated to match; no mapping needed for other values)

interface AccountRaw {
  id: string;
  name: string;
  type: string;
  balance: number;
  createdAt: string;
}

function mapAccount(raw: AccountRaw): Account {
  return { ...raw, type: raw.type as AccountType };
}

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private http  = inject(HttpClient);
  private state = inject(AppStateService);

  readonly items   = signal<Account[]>([]);
  readonly loading = signal(false);
  readonly error   = signal(false);

  private readonly base = `${environment.apiUrl}/api/accounts`;

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.http.get<AccountRaw[]>(this.base).subscribe({
      next: data => { this.items.set(data.map(mapAccount)); this.loading.set(false); },
      error: ()   => { this.error.set(true); this.loading.set(false); },
    });
  }

  create(data: { name: string; type: AccountType; balance: number }) {
    return this.http.post<AccountRaw>(this.base, data).pipe(
      tap(raw => {
        this.items.update(prev => [...prev, mapAccount(raw)]);
        this.state.showToast('success', 'ACCOUNT CREATED');
      }),
    );
  }

  update(id: string, data: { name: string; type: AccountType; balance: number }) {
    return this.http.put<AccountRaw>(`${this.base}/${id}`, data).pipe(
      tap(raw => {
        this.items.update(prev => prev.map(a => a.id === id ? mapAccount(raw) : a));
        this.state.showToast('success', 'ACCOUNT UPDATED');
      }),
    );
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.items.update(prev => prev.filter(a => a.id !== id));
        this.state.showToast('success', 'ACCOUNT DELETED');
      }),
    );
  }
}
