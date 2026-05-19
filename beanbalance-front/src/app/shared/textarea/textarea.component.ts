import { Component, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.css',
})
export class TextareaComponent {
  value       = input('');
  rows        = input(3);
  placeholder = input('');

  valueChange = output<string>();

  focused = signal(false);

  textareaStyle = computed((): Record<string, string> => ({
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    background: '#0a0a0a',
    border: `1px solid ${this.focused() ? '#ffffff' : '#2a2a2a'}`,
    color: '#ffffff',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: '13px',
    padding: '8px 10px',
    outline: 'none',
    letterSpacing: '0.04em',
    lineHeight: '1.6',
    transition: 'border-color 100ms',
  }));
}
