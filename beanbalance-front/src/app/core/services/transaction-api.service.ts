import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionType } from '../models/app.models';
import { AppStateService } from './app-state.service';

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

interface TransactionRaw {
  id: string;
  amount: number;
  type: string;
  date: string;
  description: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

function mapTransaction(raw: TransactionRaw): Transaction {
  return { ...raw, type: raw.type as TransactionType };
}

@Injectable({ providedIn: 'root' })
export class TransactionApiService {
  private http  = inject(HttpClient);
  private state = inject(AppStateService);

  readonly items   = signal<Transaction[]>([]);
  readonly loading = signal(false);
  readonly error   = signal(false);

  private readonly base = `${environment.apiUrl}/api/transactions`;

  /** Fetches up to 500 transactions sorted by date descending. */
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    const params = new HttpParams().set('size', '500').set('sort', 'date,desc');
    this.http.get<SpringPage<TransactionRaw>>(this.base, { params }).subscribe({
      next: page => {
        this.items.set(page.content.map(mapTransaction));
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  create(data: {
    amount: number;
    type: TransactionType;
    date: string;
    accountId: string;
    categoryId: string;
    description: string;
  }) {
    return this.http.post<TransactionRaw>(this.base, data).pipe(
      tap(raw => {
        this.items.update(prev => [mapTransaction(raw), ...prev]);
        this.state.showToast('success', 'TRANSACTION SAVED');
      }),
    );
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.items.update(prev => prev.filter(t => t.id !== id));
        this.state.showToast('success', 'TRANSACTION DELETED');
      }),
    );
  }
}
