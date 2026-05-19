import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.css',
})
export class ToggleComponent {
  value   = input('');
  options = input<{ value: string; label: string }[]>([]);

  valueChange = output<string>();

  optionClass(optValue: string): Record<string, boolean> {
    return { 'opt-btn': true, 'opt-active': optValue === this.value() };
  }
}
