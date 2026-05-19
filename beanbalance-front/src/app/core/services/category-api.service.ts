import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryType } from '../models/app.models';
import { AppStateService } from './app-state.service';

interface CategoryRaw {
  id: string;
  name: string;
  description: string;
  custom: boolean;
  createdAt: string;
}

function mapCategory(raw: CategoryRaw): Category {
  return { ...raw, type: (raw.custom ? 'CUSTOM' : 'SYSTEM') as CategoryType };
}

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private http  = inject(HttpClient);
  private state = inject(AppStateService);

  readonly items   = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error   = signal(false);

  private readonly base = `${environment.apiUrl}/api/categories`;

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.http.get<CategoryRaw[]>(this.base).subscribe({
      next: data => { this.items.set(data.map(mapCategory)); this.loading.set(false); },
      error: ()   => { this.error.set(true); this.loading.set(false); },
    });
  }

  create(data: { name: string; description: string }) {
    return this.http.post<CategoryRaw>(this.base, data).pipe(
      tap(raw => {
        this.items.update(prev => [...prev, mapCategory(raw)]);
        this.state.showToast('success', 'CATEGORY CREATED');
      }),
    );
  }

  update(id: string, data: { name: string; description: string }) {
    return this.http.put<CategoryRaw>(`${this.base}/${id}`, data).pipe(
      tap(raw => {
        this.items.update(prev => prev.map(c => c.id === id ? mapCategory(raw) : c));
        this.state.showToast('success', 'CATEGORY UPDATED');
      }),
    );
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.items.update(prev => prev.filter(c => c.id !== id));
        this.state.showToast('success', 'CATEGORY DELETED');
      }),
    );
  }
}
