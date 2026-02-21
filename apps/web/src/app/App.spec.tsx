import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { App } from './App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('App', () => {
  const renderApp = (): { container: HTMLDivElement; root: Root } => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<App />);
    });

    return { container, root };
  };

  it('renders playground shell controls and panels', () => {
    const { container, root } = renderApp();

    expect(container.textContent).toMatch(/Node.js Event Loop Playground/i);
    expect(container.textContent).toMatch(/Inject Request/i);
    expect(container.textContent).toMatch(/Task Queue/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('injects and runs a task through the queue controls', async () => {
    const { container, root } = renderApp();
    const buttons = Array.from(container.querySelectorAll('button'));

    const clickByText = (label: RegExp): void => {
      const button = buttons.find((item) => label.test(item.textContent ?? ''));
      expect(button).toBeTruthy();
      act(() => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    };

    clickByText(/inject request/i);
    clickByText(/^step$/i);
    clickByText(/run task/i);
    clickByText(/^step$/i);

    expect(container.textContent).toMatch(/Incoming Requests: 1/i);
    expect(container.textContent).toMatch(/Runtime Tick: 2/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
