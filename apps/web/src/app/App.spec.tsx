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

  const clickByText = (container: HTMLDivElement, label: RegExp): void => {
    const buttons = Array.from(container.querySelectorAll('button'));
    const button = buttons.find((item) => label.test(item.textContent ?? ''));
    expect(button).toBeTruthy();
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  };

  it('renders shell, simulation switch, and node board by default', () => {
    const { container, root } = renderApp();

    expect(container.textContent).toMatch(/Visual Runtime Playground/i);
    expect(container.textContent).toMatch(/Node Event Loop/i);
    expect(container.textContent).toMatch(/Event Loop Lifecycle/i);
    expect(container.textContent).toMatch(/Macrotask Queue/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('supports spawning requests and stepping simulation', () => {
    const { container, root } = renderApp();

    clickByText(container, /^pause$/i);
    clickByText(container, /\+ cpu hash request/i);
    clickByText(container, /^step$/i);
    clickByText(container, /^step$/i);

    expect(container.textContent).toMatch(/request-1/i);
    expect(container.textContent).toMatch(/Real-Time Stream/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('loads preset flow and allows clearing timeline', () => {
    const { container, root } = renderApp();

    clickByText(container, /^pause$/i);
    clickByText(container, /single request flow/i);
    clickByText(container, /^step$/i);
    clickByText(container, /clear timeline/i);

    expect(container.textContent).toMatch(/request-1|preset-db-1/i);
    expect(container.textContent).toMatch(/\(no events yet\)/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('switches to placeholder simulations', () => {
    const { container, root } = renderApp();

    clickByText(container, /react cycle/i);
    expect(container.textContent).toMatch(/React Rendering Cycle Playground/i);

    clickByText(container, /concurrency/i);
    expect(container.textContent).toMatch(/Concurrency vs Parallelism Playground/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('shows ingress, lifecycle and thread pool sections', () => {
    const { container, root } = renderApp();

    expect(container.textContent).toMatch(/Request Ingress/i);
    expect(container.textContent).toMatch(/Event Loop Lifecycle/i);
    expect(container.textContent).toMatch(/Libuv Thread Pool/i);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
