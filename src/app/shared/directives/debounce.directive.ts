import { Directive, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';

/** `(appDebounce)` — input event'lerini debounce ederek yayar. */
@Directive({
  selector: '[appDebounce]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
  },
})
export class DebounceDirective implements OnDestroy {
  @Input() debounceMs = 300;
  @Output() appDebounce = new EventEmitter<string>();

  private readonly input$ = new Subject<string>();
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.input$.pipe(debounceTime(this.debounceMs)).subscribe((value) => {
      this.appDebounce.emit(value);
    });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.input$.next(value);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
