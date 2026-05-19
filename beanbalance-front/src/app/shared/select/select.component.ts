import { Component, input, output, signal, computed, inject, ElementRef, HostListener } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
})
export class SelectComponent {
  value       = input('');
  options     = input<{ value: string; label: string }[]>([]);
  placeholder = input('SELECT...');

  valueChange = output<string>();

  open = signal(false);

  private elRef = inject(ElementRef);

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  toggleOpen() {
    this.open.update(v => !v);
  }

  select(val: string) {
    this.valueChange.emit(val);
    this.open.set(false);
  }

  selectedLabel = computed(() => {
    const opt = this.options().find(o => o.value === this.value());
    return opt ? opt.label : null;
  });

  triggerStyle = computed((): Record<string, string> => ({
    width: '100%',
    background: '#0a0a0a',
    border: `1px solid ${this.open() ? '#ffffff' : '#2a2a2a'}`,
    color: this.selectedLabel() ? '#ffffff' : '#444444',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: '13px',
    padding: '8px 10px',
    outline: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    letterSpacing: '0.04em',
    textAlign: 'left',
    transition: 'border-color 100ms',
  }));

  optionStyle(optValue: string): Record<string, string> {
    const active = optValue === this.value();
    return {
      width: '100%',
      padding: '8px 10px',
      textAlign: 'left',
      background: active ? '#ffffff' : 'transparent',
      color: active ? '#000000' : '#ffffff',
      border: 'none',
      borderBottom: '1px solid #2a2a2a',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: '13px',
      cursor: 'pointer',
      letterSpacing: '0.04em',
    };
  }
}
