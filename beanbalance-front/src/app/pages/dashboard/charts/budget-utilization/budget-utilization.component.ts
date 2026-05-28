import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BudgetApiService } from '../../../../core/services/budget-api.service';
import { formatBRL } from '../../../../core/services/app-state.service';

interface BudgetBar {
  id: string;
  name: string;
  spent: number;
  limit: number;
  pct: number;
  status: 'safe' | 'warning' | 'over';
}

@Component({
  selector: 'app-budget-utilization',
  standalone: true,
  templateUrl: './budget-utilization.component.html',
  styleUrl: './budget-utilization.component.css',
})
export class BudgetUtilizationComponent {
  private budgetApi = inject(BudgetApiService);
  private router = inject(Router);

  readonly formatBRL = formatBRL;

  readonly bars = computed((): BudgetBar[] => {
    return this.budgetApi
      .items()
      .map((b) => {
        const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
        let status: 'safe' | 'warning' | 'over' = 'safe';
        if (pct >= 100) status = 'over';
        else if (pct >= 70) status = 'warning';

        return {
          id: b.id,
          name: b.categoryName.toUpperCase(),
          spent: b.spent,
          limit: b.limit,
          pct,
          status,
        };
      })
      .sort((a, b) => b.pct - a.pct); // highest utilisation first
  });

  barWidth(bar: BudgetBar): string {
    return Math.min(bar.pct, 100) + '%';
  }

  pctLabel(bar: BudgetBar): string {
    return Math.round(bar.pct) + '%';
  }

  goToBudgets(): void {
    this.router.navigate(['/budgets']);
  }
}
