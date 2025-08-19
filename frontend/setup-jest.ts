import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();


// matchMedia shim (some components query it)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},        // deprecated
    removeListener: () => {},     // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// ResizeObserver shim (CDK uses it in overlays/layout)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = (global as any).ResizeObserver ?? ResizeObserverMock;

// Silence noisy jsdom “Could not parse CSS stylesheet” logs (Material @layer CSS)
const realError = console.error.bind(console);
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (String(args[0]).includes('Could not parse CSS stylesheet')) return;
    realError(...args);
  });
});

// Optional: stub scrollTo to avoid not-implemented warnings
window.scrollTo = window.scrollTo || (() => {});