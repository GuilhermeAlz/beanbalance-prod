import {
  Component,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { TransactionApiService } from '../../../../core/services/transaction-api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type ViewMode = 1 | 3 | 6 | 12;

interface ChartData {
  labels: string[];
  income: number[];
  expense: number[];
}

@Component({
  selector: 'app-spending-over-time',
  standalone: true,
  templateUrl: './spending-over-time.component.html',
  styleUrl: './spending-over-time.component.css',
})
export class SpendingOverTimeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private txApi = inject(TransactionApiService);
  private chart: Chart | null = null;

  readonly viewOptions: ViewMode[] = [1, 3, 6, 12];
  readonly selectedView = signal<ViewMode>(6);

  /** Offset for 1M mode: 0 = current month, 1 = previous month, etc. */
  readonly monthOffset = signal(0);

  /** Whether we're in daily (1M) mode */
  readonly isDailyMode = computed(() => this.selectedView() === 1);

  /** Label for the current month when in 1M mode (e.g. "MAY 2026") */
  readonly currentMonthLabel = computed(() => {
    const offset = this.monthOffset();
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d
      .toLocaleString('en', { month: 'long', year: 'numeric' })
      .toUpperCase();
  });

  /** Chart data computed reactively based on mode */
  private chartData = computed((): ChartData => {
    const mode = this.selectedView();
    if (mode === 1) {
      return this.computeDailyData();
    }
    return this.computeMonthlyData(mode);
  });

  constructor() {
    effect(() => {
      const data = this.chartData();
      if (this.chart) {
        this.updateChart(data);
      }
    });
  }

  ngAfterViewInit(): void {
    this.createChart(this.chartData());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  setView(mode: ViewMode): void {
    this.selectedView.set(mode);
    if (mode !== 1) {
      this.monthOffset.set(0); // reset offset when leaving 1M mode
    }
  }

  prevMonth(): void {
    this.monthOffset.update((v) => v + 1);
  }

  nextMonth(): void {
    this.monthOffset.update((v) => Math.max(0, v - 1));
  }

  canGoNext(): boolean {
    return this.monthOffset() > 0;
  }

  viewLabel(opt: ViewMode): string {
    return opt + 'M';
  }

  // ── Data computation ──────────────────────────────────────────

  private computeMonthlyData(n: number): ChartData {
    const now = new Date();
    const months: { label: string; key: string }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d
        .toLocaleString('en', { month: 'short', year: '2-digit' })
        .toUpperCase();
      months.push({ label, key });
    }

    const txs = this.txApi.items();
    const income: number[] = [];
    const expense: number[] = [];

    for (const m of months) {
      const inMonth = txs.filter((t) => t.date.startsWith(m.key));
      income.push(
        inMonth
          .filter((t) => t.type === 'INCOME')
          .reduce((s, t) => s + t.amount, 0),
      );
      expense.push(
        inMonth
          .filter((t) => t.type === 'EXPENSE')
          .reduce((s, t) => s + t.amount, 0),
      );
    }

    return { labels: months.map((m) => m.label), income, expense };
  }

  private computeDailyData(): ChartData {
    const offset = this.monthOffset();
    const now = new Date();
    const targetMonth = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1,
    );
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthKey = targetMonth.toISOString().slice(0, 7); // "2026-05"

    const txs = this.txApi
      .items()
      .filter((t) => t.date.startsWith(monthKey));

    const labels: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${monthKey}-${dayStr}`;
      labels.push(String(day));

      const dayTxs = txs.filter((t) => t.date === dateKey);
      income.push(
        dayTxs
          .filter((t) => t.type === 'INCOME')
          .reduce((s, t) => s + t.amount, 0),
      );
      expense.push(
        dayTxs
          .filter((t) => t.type === 'EXPENSE')
          .reduce((s, t) => s + t.amount, 0),
      );
    }

    return { labels, income, expense };
  }

  // ── Chart rendering ───────────────────────────────────────────

  private createChart(data: ChartData): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;

    const incomeGrad = ctx.createLinearGradient(0, 0, 0, 220);
    incomeGrad.addColorStop(0, 'rgba(74, 222, 128, 0.25)');
    incomeGrad.addColorStop(1, 'rgba(74, 222, 128, 0.01)');

    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 220);
    expenseGrad.addColorStop(0, 'rgba(248, 113, 113, 0.25)');
    expenseGrad.addColorStop(1, 'rgba(248, 113, 113, 0.01)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'INCOME',
            data: data.income,
            borderColor: '#4ade80',
            backgroundColor: incomeGrad,
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: this.isDailyMode() ? 1.5 : 3,
            pointBackgroundColor: '#4ade80',
            pointBorderColor: '#111111',
            pointBorderWidth: this.isDailyMode() ? 1 : 2,
            pointHoverRadius: 5,
          },
          {
            label: 'EXPENSES',
            data: data.expense,
            borderColor: '#f87171',
            backgroundColor: expenseGrad,
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: this.isDailyMode() ? 1.5 : 3,
            pointBackgroundColor: '#f87171',
            pointBorderColor: '#111111',
            pointBorderWidth: this.isDailyMode() ? 1 : 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
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
                const val = ctx.parsed.y ?? 0;
                return (
                  ' ' +
                  ctx.dataset.label +
                  ': R$ ' +
                  val.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                );
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#1a1a1a' },
            ticks: {
              color: '#555555',
              font: {
                family: "'JetBrains Mono', 'Courier New', monospace",
                size: 10,
              },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: this.isDailyMode() ? 15 : undefined,
            },
            border: { color: '#2a2a2a' },
          },
          y: {
            grid: { color: '#1a1a1a' },
            ticks: {
              color: '#555555',
              font: {
                family: "'JetBrains Mono', 'Courier New', monospace",
                size: 10,
              },
              callback: (value) => {
                const num = Number(value);
                if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
                return num.toString();
              },
            },
            border: { color: '#2a2a2a' },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private updateChart(data: ChartData): void {
    if (!this.chart) return;

    const isDaily = this.isDailyMode();

    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.income;
    this.chart.data.datasets[1].data = data.expense;

    // Adjust point sizes for daily vs monthly mode
    for (const ds of this.chart.data.datasets) {
      (ds as any).pointRadius = isDaily ? 1.5 : 3;
      (ds as any).pointBorderWidth = isDaily ? 1 : 2;
    }

    // Adjust x-axis tick limit for daily mode
    const xScale = (this.chart.options.scales as any)?.['x'];
    if (xScale?.ticks) {
      xScale.ticks.maxTicksLimit = isDaily ? 15 : undefined;
    }

    this.chart.update('none');
  }
}
