import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AppStateService } from '../core/services/app-state.service';
import { AuthApiService } from '../core/services/auth-api.service';
import { ToastContainerComponent } from '../shared/toast-container/toast-container.component';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

const navItems = [
  { path: '/dashboard',    label: 'DASHBOARD',    icon: '#' },
  { path: '/accounts',     label: 'ACCOUNTS',     icon: '≡' },
  { path: '/transactions', label: 'TRANSACTIONS', icon: '↕' },
  { path: '/budgets',      label: 'BUDGETS',      icon: '◎' },
  { path: '/categories',   label: 'CATEGORIES',   icon: '⊞' },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgStyle, ToastContainerComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  private router = inject(Router);
  state = inject(AppStateService);
  private authApi = inject(AuthApiService);

  collapsed = signal(false);
  logoutHovered = signal(false);
  topbarLogoutHovered = signal(false);
  navItems = navItems;

  private pageTitle$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map((e: NavigationEnd) => e.urlAfterRedirects.split('/')[1]?.toUpperCase() || 'DASHBOARD'),
    startWith(this.router.url.split('/')[1]?.toUpperCase() || 'DASHBOARD'),
  );
  pageTitle = toSignal(this.pageTitle$, { initialValue: 'DASHBOARD' });

  toggleCollapsed() {
    this.collapsed.update(c => !c);
  }

  handleLogout() {
    this.authApi.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  sidebarStyle = computed(() => ({
    width: this.collapsed() ? '40px' : '200px',
    minWidth: this.collapsed() ? '40px' : '200px',
    background: '#111111',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 100ms',
    overflow: 'hidden',
  }));

  logoPaddingStyle = computed(() => ({
    padding: this.collapsed() ? '16px 0' : '16px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }));

  logoutBtnStyle = computed(() => ({
    background: 'transparent',
    border: `1px solid ${this.logoutHovered() ? '#ffffff' : '#2a2a2a'}`,
    color: this.logoutHovered() ? '#ffffff' : '#888888',
    padding: '4px 8px',
    fontSize: '11px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'border-color 100ms, color 100ms',
  }));

  topbarLogoutBtnStyle = computed(() => ({
    background: 'transparent',
    border: `1px solid ${this.topbarLogoutHovered() ? '#ffffff' : '#2a2a2a'}`,
    color: this.topbarLogoutHovered() ? '#ffffff' : '#888888',
    padding: '3px 8px',
    fontSize: '11px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'border-color 100ms, color 100ms',
  }));

  navLinkStyle(isActive: boolean) {
    return {
      display: 'flex',
      alignItems: 'center',
      height: '40px',
      padding: this.collapsed() ? '0 12px' : '0 16px',
      gap: '10px',
      textDecoration: 'none',
      fontSize: '12px',
      letterSpacing: '0.08em',
      color: isActive ? '#000000' : '#ffffff',
      background: isActive ? '#ffffff' : 'transparent',
      transition: 'background 100ms',
    };
  }
}
