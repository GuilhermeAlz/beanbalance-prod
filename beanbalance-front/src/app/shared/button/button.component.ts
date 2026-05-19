import { Component, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  variant   = input<'primary' | 'ghost' | 'danger'>('primary');
  fullWidth = input(false);
  small     = input(false);
  disabled  = input(false);
  type      = input<'button' | 'submit' | 'reset'>('button');
  extraStyle = input<Record<string, string>>({});

  clicked = output<void>();

  hovered = signal(false);

  buttonStyle = computed((): Record<string, string> => {
    const h = this.hovered();
    const v = this.variant();

    const base: Record<string, string> = {
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      letterSpacing: '0.1em',
      cursor: this.disabled() ? 'not-allowed' : 'pointer',
      border: '1px solid',
      fontSize: this.small() ? '11px' : '12px',
      padding: this.small() ? '4px 10px' : '8px 16px',
      width: this.fullWidth() ? '100%' : 'auto',
      transition: 'background 100ms, border-color 100ms, color 100ms',
      opacity: this.disabled() ? '0.4' : '1',
    };

    let variantStyle: Record<string, string> = {};
    if (v === 'primary' || v === 'danger') {
      variantStyle = {
        background: h ? '#e0e0e0' : '#ffffff',
        borderColor: '#ffffff',
        color: '#000000',
      };
    } else if (v === 'ghost') {
      variantStyle = {
        background: 'transparent',
        borderColor: h ? '#ffffff' : '#2a2a2a',
        color: '#ffffff',
      };
    }

    return { ...base, ...variantStyle, ...this.extraStyle() };
  });
}
