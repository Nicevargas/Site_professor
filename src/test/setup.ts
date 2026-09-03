import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// APIs de navegador que o jsdom não implementa e que alguns componentes tocam
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
if (!('ResizeObserver' in window)) (window as any).ResizeObserver = NoopObserver;
if (!('IntersectionObserver' in window)) (window as any).IntersectionObserver = NoopObserver;
if (!window.scrollTo) window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
if (!HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = vi.fn();

// Limpa o DOM, o armazenamento e a URL entre os testes
afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
  } catch {
    // ambiente sem localStorage
  }
  window.history.replaceState(null, '', '/');
});
