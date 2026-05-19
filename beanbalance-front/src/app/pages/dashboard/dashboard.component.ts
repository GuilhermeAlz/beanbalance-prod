import { Component, OnInit, computed, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AppStateService, formatBRL, formatDate } from '../../core/services/app-state.service';
import { AccountApiService } from '../../core/services/account-api.service';
import { TransactionApiService } from '../../core/services/transaction-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { BudgetApiService } from '../../core/services/budget-api.service';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';
import { BadgeComponent } from '../../shared/badge/badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SectionHeaderComponent, ProgressBarComponent, BadgeComponent, UpperCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private router      = inject(Router);
  private state       = inject(AppStateService);
  readonly accountApi  = inject(AccountApiService);
  private txApi       = inject(TransactionApiService);
  private categoryApi = inject(CategoryApiService);
  private budgetApi   = inject(BudgetApiService);

  formatBRL = formatBRL;
  formatDate = formatDate;

  readonly currentMonth = new Date().toISOString().slice(0, 7);

  ngOnInit(): void {
    this.accountApi.load();
    this.txApi.load();
    this.categoryApi.load();
    this.budgetApi.load(this.currentMonth);
  }

  totalBalance = computed(() =>
    this.accountApi.items().reduce((s, a) => s + a.balance, 0)
  );

  private currentMonthTxs = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    return this.txApi.items().filter(t => t.date.startsWith(month));
  });

  monthIncome = computed(() =>
    this.currentMonthTxs().filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  );

  monthExpense = computed(() =>
    this.currentMonthTxs().filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  );

  recent = computed(() =>
    [...this.txApi.items()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  );

  budgets = this.budgetApi.items;

  getCat(id: string) {
    return this.categoryApi.items().find(c => c.id === id);
  }

  getAcc(id: string) {
    return this.accountApi.items().find(a => a.id === id);
  }

  getAccLabel(id: string): string {
    const acc = this.accountApi.items().find(a => a.id === id);
    return acc ? acc.name.split(' ')[0].toUpperCase() : '—';
  }

  goToTransactions() {
    this.router.navigate(['/transactions']);
  }

  goToBudgets() {
    this.router.navigate(['/budgets']);
  }
}
