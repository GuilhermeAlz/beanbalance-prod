import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
})
export class ProgressBarComponent {
  value = input(0);
  max   = input(100);

  pct = computed(() => Math.min((this.value() / this.max()) * 100, 100));
}
