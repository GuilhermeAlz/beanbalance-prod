import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Budget } from '../models/app.models';
import { AppStateService } from './app-state.service';

// Spring BudgetResponse uses limitAmount / spentAmount / referenceMonth.
// Angular Budget model keeps limit / spent / month for minimal template churn.
interface BudgetRaw {
  id: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  referenceMonth: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

function mapBudget(raw: BudgetRaw): Budget {
  return {
    id: raw.id,
    categoryId: raw.categoryId,
    categoryName: raw.categoryName,
    limit: raw.limitAmount,
    spent: raw.spentAmount,
    month: raw.referenceMonth,
    createdAt: raw.createdAt,
  };
}

@Injectable({ providedIn: 'root' })
export class BudgetApiService {
  private http  = inject(HttpClient);
  private state = inject(AppStateService);

  readonly items   = signal<Budget[]>([]);
  readonly loading = signal(false);
  readonly error   = signal(false);

  private readonly base = `${environment.apiUrl}/api/budgets`;

  load(month?: string): void {
    this.loading.set(true);
    this.error.set(false);
    const url = month ? `${this.base}?month=${month}` : this.base;
    this.http.get<BudgetRaw[]>(url).subscribe({
      next: data => { this.items.set(data.map(mapBudget)); this.loading.set(false); },
      error: ()   => { this.error.set(true); this.loading.set(false); },
    });
  }

  create(data: { limitAmount: number; referenceMonth: string; categoryId: string }) {
    return this.http.post<BudgetRaw>(this.base, data).pipe(
      tap(raw => {
        this.items.update(prev => [...prev, mapBudget(raw)]);
        this.state.showToast('success', 'BUDGET CREATED');
      }),
    );
  }

  update(id: string, data: { limitAmount: number; referenceMonth: string; categoryId: string }) {
    return this.http.put<BudgetRaw>(`${this.base}/${id}`, data).pipe(
      tap(raw => {
        this.items.update(prev => prev.map(b => b.id === id ? mapBudget(raw) : b));
        this.state.showToast('success', 'BUDGET UPDATED');
      }),
    );
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.items.update(prev => prev.filter(b => b.id !== id));
        this.state.showToast('success', 'BUDGET DELETED');
      }),
    );
  }
}
