import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateService, formatBRL, formatDate } from '../../core/services/app-state.service';
import { AccountApiService } from '../../core/services/account-api.service';
import { Account, AccountType } from '../../core/models/app.models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { DrawerComponent } from '../../shared/drawer/drawer.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { InputComponent } from '../../shared/input/input.component';
import { SelectComponent } from '../../shared/select/select.component';
import { DeleteModalComponent } from '../../shared/delete-modal/delete-modal.component';
import { BadgeComponent } from '../../shared/badge/badge.component';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CHECKING',    label: 'CHECKING' },
  { value: 'SAVINGS',     label: 'SAVINGS' },
  { value: 'CREDIT_CARD', label: 'CREDIT CARD' },
  { value: 'INVESTMENT',  label: 'INVESTMENT' },
  { value: 'CASH',        label: 'CASH' },
];

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    PageHeaderComponent, ButtonComponent, EmptyStateComponent,
    DrawerComponent, FormFieldComponent, InputComponent, SelectComponent,
    DeleteModalComponent, BadgeComponent,
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css',
})
export class AccountsComponent implements OnInit {
  private state      = inject(AppStateService);
  private accountApi = inject(AccountApiService);
  private router     = inject(Router);

  accounts = this.accountApi.items;
  loading  = this.accountApi.loading;

  readonly typeOptions = ACCOUNT_TYPE_OPTIONS;
  readonly formatBRL   = formatBRL;
  readonly formatDate  = formatDate;

  drawerOpen = signal(false);
  editId     = signal<string | null>(null);
  deleteId   = signal<string | null>(null);

  formName    = signal('');
  formType    = signal('');
  formBalance = signal('');

  deleteTarget = computed(() => this.accounts().find(a => a.id === this.deleteId()));

  ngOnInit(): void {
    this.accountApi.load();
  }

  openCreate() {
    this.editId.set(null);
    this.formName.set('');
    this.formType.set('');
    this.formBalance.set('');
    this.drawerOpen.set(true);
  }

  openEdit(acc: Account) {
    this.editId.set(acc.id);
    this.formName.set(acc.name);
    this.formType.set(acc.type);
    this.formBalance.set(acc.balance.toString());
    this.drawerOpen.set(true);
  }

  handleSave() {
    if (!this.formName() || !this.formType()) return;
    const balance = parseFloat(this.formBalance()) || 0;
    const id = this.editId();
    const payload = { name: this.formName(), type: this.formType() as AccountType, balance };
    if (id) {
      this.accountApi.update(id, payload).subscribe({
        next: () => this.drawerOpen.set(false),
        error: () => this.state.showToast('error', 'FAILED TO UPDATE ACCOUNT'),
      });
    } else {
      this.accountApi.create(payload).subscribe({
        next: () => this.drawerOpen.set(false),
        error: () => this.state.showToast('error', 'FAILED TO CREATE ACCOUNT'),
      });
    }
  }

  confirmDelete() {
    const id = this.deleteId();
    if (!id) return;
    this.accountApi.delete(id).subscribe({
      next: () => this.deleteId.set(null),
      error: () => this.state.showToast('error', 'FAILED TO DELETE ACCOUNT'),
    });
  }

  goToDetail(id: string) {
    this.router.navigate(['/accounts', id]);
  }
}
