import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';

export interface DoughnutDilim {
  etiket: string;
  deger: number;
  renk: string;
}

/**
 * Genel amaçlı, tekrar kullanılabilir donut grafik sarmalayıcısı.
 * Chart.js instance'ı yalnızca burada yaşar; veri değiştiğinde günceller,
 * bileşen yok olunca temizler.
 */
@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  template: `
    <div class="doughnut-chart" [style.height.px]="boyut">
      <canvas #canvasRef></canvas>
    </div>
  `,
  styles: [
    `
      .doughnut-chart { position: relative; width: 100%; }
      canvas { max-width: 100%; }
    `,
  ],
})
export class DoughnutChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() dilimler: DoughnutDilim[] = [];
  @Input() boyut = 200;
  @Input() merkezEtiket = '';

  @ViewChild('canvasRef') private canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.olustur();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['dilimler'] || !this.chart) return;
    this.guncelle();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private config(): ChartConfiguration<'doughnut'> {
    return {
      type: 'doughnut',
      data: {
        labels: this.dilimler.map((d) => d.etiket),
        datasets: [
          {
            data: this.dilimler.map((d) => d.deger),
            backgroundColor: this.dilimler.map((d) => d.renk),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        cutout: '68%',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 10,
            titleFont: { family: 'Inter', size: 12 },
            bodyFont: { family: 'Inter', size: 12 },
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.formattedValue}`,
            },
          },
        },
      },
    };
  }

  private olustur(): void {
    if (!this.canvasRef) return;
    this.chart = new Chart(this.canvasRef.nativeElement, this.config());
  }

  private guncelle(): void {
    if (!this.chart) return;
    this.chart.data.labels = this.dilimler.map((d) => d.etiket);
    this.chart.data.datasets[0].data = this.dilimler.map((d) => d.deger);
    this.chart.data.datasets[0].backgroundColor = this.dilimler.map((d) => d.renk);
    this.chart.update();
  }
}
