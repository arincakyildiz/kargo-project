import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, TooltipModel } from 'chart.js/auto';

export interface DoughnutDilim {
  etiket: string;
  deger: number;
  renk: string;
}

/**
 * Genel amaçlı, tekrar kullanılabilir donut grafik sarmalayıcısı.
 * Chart.js instance'ı yalnızca burada yaşar; veri değiştiğinde günceller,
 * bileşen yok olunca temizler. Tooltip, ortadaki HTML etiketiyle
 * çakışmaması için Chart.js'in canvas-içi varsayılanı yerine ayrı bir
 * DOM elemanı olarak (her zaman üstte) çizilir.
 */
@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  template: `
    <div class="doughnut-chart" [style.height.px]="boyut">
      <canvas #canvasRef></canvas>
      <div class="doughnut-chart__tooltip" #tooltipRef>
        <span class="doughnut-chart__tooltip-dot"></span>
        <span class="doughnut-chart__tooltip-label"></span>
        <span class="doughnut-chart__tooltip-value"></span>
      </div>
    </div>
  `,
  styles: [
    `
      .doughnut-chart { position: relative; width: 100%; }
      canvas { max-width: 100%; }

      .doughnut-chart__tooltip {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.65rem;
        border-radius: 8px;
        background: var(--sidebar-bg, #12172b);
        color: #fff;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 0.76rem;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.2));
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -115%);
        transition: opacity 0.1s ease;
      }
      .doughnut-chart__tooltip--visible { opacity: 1; }
      .doughnut-chart__tooltip-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .doughnut-chart__tooltip-value { color: rgba(255, 255, 255, 0.7); font-weight: 500; }
    `,
  ],
})
export class DoughnutChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() dilimler: DoughnutDilim[] = [];
  @Input() boyut = 200;
  @Input() merkezEtiket = '';

  @ViewChild('canvasRef') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tooltipRef') private tooltipRef!: ElementRef<HTMLDivElement>;
  private chart?: Chart;

  constructor(private renderer: Renderer2) {}

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
            enabled: false,
            external: (ctx) => this.harigiTooltipCiz(ctx.tooltip),
          },
        },
      },
    };
  }

  private harigiTooltipCiz(tooltip: TooltipModel<'doughnut'>): void {
    const el = this.tooltipRef?.nativeElement;
    if (!el) return;

    if (!tooltip.opacity || !tooltip.dataPoints?.length) {
      this.renderer.removeClass(el, 'doughnut-chart__tooltip--visible');
      return;
    }

    const nokta = tooltip.dataPoints[0];
    const renk = (nokta.dataset.backgroundColor as string[])[nokta.dataIndex];

    const dot = el.querySelector('.doughnut-chart__tooltip-dot') as HTMLElement;
    const label = el.querySelector('.doughnut-chart__tooltip-label') as HTMLElement;
    const value = el.querySelector('.doughnut-chart__tooltip-value') as HTMLElement;
    dot.style.background = renk;
    label.textContent = String(nokta.label);
    value.textContent = String(nokta.formattedValue);

    this.renderer.addClass(el, 'doughnut-chart__tooltip--visible');
    this.renderer.setStyle(el, 'left', `${tooltip.caretX}px`);
    this.renderer.setStyle(el, 'top', `${tooltip.caretY}px`);
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
