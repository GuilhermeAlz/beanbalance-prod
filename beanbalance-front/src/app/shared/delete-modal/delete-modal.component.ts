import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-modal',
  standalone: true,
  templateUrl: './delete-modal.component.html',
  styleUrl: './delete-modal.component.css',
})
export class DeleteModalComponent {
  open       = input(false);
  entityName = input('');
  note       = input('');

  confirmed = output<void>();
  cancelled = output<void>();
}
