import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  page  = input(1);
  total = input(1);

  pageChange = output<number>();

  pages = computed(() => Array.from({ length: this.total() }, (_, i) => i + 1));

  prev() {
    if (this.page() > 1) this.pageChange.emit(this.page() - 1);
  }

  next() {
    if (this.page() < this.total()) this.pageChange.emit(this.page() + 1);
  }
}
