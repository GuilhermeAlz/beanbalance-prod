import { Component, input, computed } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
})
export class BadgeComponent {
  variant = input<'default' | 'muted' | 'over'>('default');

  badgeStyle = computed((): Record<string, string> => {
    const colors: Record<string, Record<string, string>> = {
      default: { border: '1px solid #2a2a2a', color: '#888888' },
      muted:   { border: '1px solid #444444', color: '#555555' },
      over:    { border: '1px solid #888888', color: '#888888' },
    };
    return {
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: '10px',
      letterSpacing: '0.1em',
      padding: '2px 6px',
      background: 'transparent',
      ...colors[this.variant()],
    };
  });
}
