import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AppStateService, formatBRL } from '../../core/services/app-state.service';
import { BudgetApiService } from '../../core/services/budget-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { Budget } from '../../core/models/app.models';
import { ButtonComponent } from '../../shared/button/button.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { DrawerComponent } from '../../shared/drawer/drawer.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { InputComponent } from '../../shared/input/input.component';
import { SelectComponent } from '../../shared/select/select.component';
import { DeleteModalComponent } from '../../shared/delete-modal/delete-modal.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    ButtonComponent, EmptyStateComponent,
    DrawerComponent, FormFieldComponent, InputComponent, SelectComponent,
    DeleteModalComponent, ProgressBarComponent,
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.css',
})
export class BudgetsComponent implements OnInit {
  private state       = inject(AppStateService);
  private budgetApi   = inject(BudgetApiService);
  private categoryApi = inject(CategoryApiService);

  readonly formatBRL = formatBRL;

  currentMonth = signal(new Date().toISOString().slice(0, 7));

  monthBudgets = computed(() =>
    this.budgetApi.items().filter(b => b.month === this.currentMonth())
  );

  categoryOptions = computed(() =>
    this.categoryApi.items().map(c => ({ value: c.id, label: c.name.toUpperCase() }))
  );

  monthLabel = computed(() => this.formatMonthLabel(this.currentMonth()));

  drawerOpen = signal(false);
  editId     = signal<string | null>(null);
  deleteId   = signal<string | null>(null);

  formCategoryId = signal('');
  formLimit      = signal('');
  formMonth      = signal(new Date().toISOString().slice(0, 7));

  deleteTarget = computed(() =>
    this.budgetApi.items().find(b => b.id === this.deleteId())
  );

  deleteTargetCatName = computed(() =>
    this.deleteTarget()?.categoryName?.toUpperCase() ?? ''
  );

  ngOnInit(): void {
    this.categoryApi.load();
    this.budgetApi.load(this.currentMonth());
  }

  prevMonth() {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    this.currentMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    this.budgetApi.load(this.currentMonth());
  }

  nextMonth() {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const d = new Date(y, m, 1);
    this.currentMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    this.budgetApi.load(this.currentMonth());
  }

  formatMonthLabel(month: string): string {
    const [y, mo] = month.split('-').map(Number);
    return `${MONTH_NAMES[mo - 1]} ${y}`;
  }

  openCreate() {
    this.editId.set(null);
    this.formCategoryId.set('');
    this.formLimit.set('');
    this.formMonth.set(this.currentMonth());
    this.drawerOpen.set(true);
  }

  openEdit(b: Budget) {
    this.editId.set(b.id);
    this.formCategoryId.set(b.categoryId);
    this.formLimit.set(b.limit.toString());
    this.formMonth.set(b.month);
    this.drawerOpen.set(true);
  }

  handleSave() {
    if (!this.formCategoryId() || !this.formLimit()) return;
    const id = this.editId();
    const payload = {
      categoryId:     this.formCategoryId(),
      limitAmount:    parseFloat(this.formLimit()) || 0,
      referenceMonth: this.formMonth(),
    };
    if (id) {
      this.budgetApi.update(id, payload).subscribe({
        next: () => this.drawerOpen.set(false),
        error: () => this.state.showToast('error', 'FAILED TO UPDATE BUDGET'),
      });
    } else {
      this.budgetApi.create(payload).subscribe({
        next: () => this.drawerOpen.set(false),
        error: () => this.state.showToast('error', 'FAILED TO CREATE BUDGET'),
      });
    }
  }

  confirmDelete() {
    const id = this.deleteId();
    if (!id) return;
    this.budgetApi.delete(id).subscribe({
      next: () => this.deleteId.set(null),
      error: () => this.state.showToast('error', 'FAILED TO DELETE BUDGET'),
    });
  }

  isOver(b: Budget): boolean {
    return b.spent > b.limit;
  }

  remaining(b: Budget): number {
    return b.limit - b.spent;
  }
}
