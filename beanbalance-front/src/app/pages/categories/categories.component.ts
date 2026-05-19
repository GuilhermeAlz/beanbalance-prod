import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AppStateService, formatDate } from '../../core/services/app-state.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { Category } from '../../core/models/app.models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { DrawerComponent } from '../../shared/drawer/drawer.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { InputComponent } from '../../shared/input/input.component';
import { TextareaComponent } from '../../shared/textarea/textarea.component';
import { DeleteModalComponent } from '../../shared/delete-modal/delete-modal.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    PageHeaderComponent, ButtonComponent, EmptyStateComponent,
    DrawerComponent, FormFieldComponent, InputComponent, TextareaComponent,
    DeleteModalComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements OnInit {
  private state       = inject(AppStateService);
  private categoryApi = inject(CategoryApiService);

  readonly formatDate = formatDate;

  systemCats = computed(() => this.categoryApi.items().filter(c => c.type === 'SYSTEM'));
  customCats = computed(() => this.categoryApi.items().filter(c => c.type === 'CUSTOM'));

  ngOnInit(): void {
    this.categoryApi.load();
  }

  drawerOpen = signal(false);
  editId     = signal<string | null>(null);
  deleteId   = signal<string | null>(null);

  formName        = signal('');
  formDescription = signal('');

  deleteTarget = computed(() =>
    this.categoryApi.items().find(c => c.id === this.deleteId())
  );

  openCreate() {
    this.editId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.drawerOpen.set(true);
  }

  openEdit(cat: Category) {
    this.editId.set(cat.id);
    this.formName.set(cat.name);
    this.formDescription.set(cat.description);
    this.drawerOpen.set(true);
  }

  handleSave() {
    if (!this.formName()) return;
    const id = this.editId();
    const payload = { name: this.formName(), description: this.formDescription() };
    if (id) {
      this.categoryApi.update(id, payload).subscribe({
        next: () => this.drawerOpen.set(false),
        error: () => this.state.showToast('error', 'FAILED TO UPDATE CATEGORY'),
      });
    } else {
      this.categoryApi.create(payload).subscribe({
        next: () => this.drawerOpen.set(false),
        error: () => this.state.showToast('error', 'FAILED TO CREATE CATEGORY'),
      });
    }
  }

  confirmDelete() {
    const id = this.deleteId();
    if (!id) return;
    this.categoryApi.delete(id).subscribe({
      next: () => this.deleteId.set(null),
      error: () => this.state.showToast('error', 'FAILED TO DELETE CATEGORY'),
    });
  }
}
