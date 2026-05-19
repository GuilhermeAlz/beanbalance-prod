import { Component, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
})
export class InputComponent {
  value      = input<string | number>('');
  type       = input('text');
  placeholder = input('');
  disabled   = input(false);
  textAlign  = input<'left' | 'right'>('left');
  extraStyle = input<Record<string, string>>({});

  valueChange = output<string>();

  focused = signal(false);

  inputStyle = computed((): Record<string, string> => ({
    width: '100%',
    boxSizing: 'border-box',
    background: '#0a0a0a',
    border: `1px solid ${this.focused() ? '#ffffff' : '#2a2a2a'}`,
    color: this.disabled() ? '#444444' : '#ffffff',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: '13px',
    padding: '8px 10px',
    outline: 'none',
    textAlign: this.textAlign(),
    letterSpacing: '0.04em',
    transition: 'border-color 100ms',
    ...this.extraStyle(),
  }));
}
