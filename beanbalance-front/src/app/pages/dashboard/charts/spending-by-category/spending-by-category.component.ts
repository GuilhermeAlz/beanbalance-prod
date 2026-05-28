import {
  Component,
  OnDestroy,
  ElementRef,
  ViewChild,
  computed,
  inject,
  effect,
} from '@angular/core';
import { TransactionApiService } from '../../../../core/services/transaction-api.service';
import { formatBRL } from '../../../../core/services/app-state.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/** Curated palette that harmonises with the dark theme. */
const CATEGORY_COLORS = [
  '#6366f1', // indigo
  '#f97316', // orange
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#eab308', // yellow
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#d946ef', // fuchsia
];

interface CategorySlice {
  name: string;
  amount: number;
  color: string;
}

@Component({
  selector: 'app-spending-by-category',
  standalone: true,
  templateUrl: './spending-by-category.component.html',
  styleUrl: './spending-by-category.component.css',
})
export class SpendingByCategoryComponent implements OnDestroy {
  private txApi = inject(TransactionApiService);
  private chart: Chart | null = null;

  readonly formatBRL = formatBRL;

  /** Setter fires whenever Angular adds/removes the canvas from the DOM. */
  @ViewChild('canvas')
  set canvasRef(el: ElementRef<HTMLCanvasElement> | undefined) {
    if (!el) {
      // Canvas was removed (slices went to 0) — destroy chart
      this.chart?.destroy();
      this.chart = null;
      return;
    }
    // Canvas just appeared in the DOM: create chart with current data
    this.chart?.destroy();
    this.createChart(el.nativeElement, this.slices());
  }

  readonly slices = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    const expenses = this.txApi
      .items()
      .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(month));

    // Group by category
    const map = new Map<string, { name: string; total: number }>();
    for (const tx of expenses) {
      const entry = map.get(tx.categoryId) || {
        name: tx.categoryName,
        total: 0,
      };
      entry.total += tx.amount;
      map.set(tx.categoryId, entry);
    }

    // Sort descending by amount
    const sorted = [...map.values()].sort((a, b) => b.total - a.total);

    return sorted.map(
      (entry, i): CategorySlice => ({
        name: entry.name.toUpperCase(),
        amount: entry.total,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }),
    );
  });

  readonly totalExpense = computed(() =>
    this.slices().reduce((s, c) => s + c.amount, 0),
  );

  constructor() {
    effect(() => {
      const data = this.slices();
      if (this.chart) {
        this.updateChart(data);
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  pct(amount: number): string {
    const total = this.totalExpense();
    if (total === 0) return '0%';
    return Math.round((amount / total) * 100) + '%';
  }

  private createChart(canvas: HTMLCanvasElement, data: CategorySlice[]): void {
    const ctx = canvas.getContext('2d')!;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.name),
        datasets: [
          {
            data: data.map((d) => d.amount),
            backgroundColor: data.map((d) => d.color),
            borderColor: '#111111',
            borderWidth: 2,
            hoverBorderColor: '#111111',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            borderWidth: 1,
            titleColor: '#888888',
            bodyColor: '#ffffff',
            titleFont: {
              family: "'JetBrains Mono', 'Courier New', monospace",
              size: 10,
            },
            bodyFont: {
              family: "'JetBrains Mono', 'Courier New', monospace",
              size: 11,
            },
            padding: 10,
            cornerRadius: 0,
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            boxPadding: 4,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                const total = (ctx.dataset.data as number[]).reduce(
                  (a, b) => a + b,
                  0,
                );
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  ' R$ ' +
                  val.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) +
                  ' (' +
                  pct +
                  '%)'
                );
              },
            },
          },
        },
      },
    });
  }

  private updateChart(data: CategorySlice[]): void {
    if (!this.chart) return;
    this.chart.data.labels = data.map((d) => d.name);
    this.chart.data.datasets[0].data = data.map((d) => d.amount);
    this.chart.data.datasets[0].backgroundColor = data.map((d) => d.color);
    this.chart.update('none');
  }
}
