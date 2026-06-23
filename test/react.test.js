import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { Tabar } from '../src/tabar.js';
import { useTabar } from '../src/react.js';

afterEach(cleanup);

describe('useTabar (React)', () => {
  it('mounts an inline bar into the ref and destroys it on unmount', () => {
    function Demo() {
      const { ref } = useTabar({ id: 'react-bar', value: 0.5, trickle: false });
      return createElement('div', { ref });
    }

    const { unmount } = render(createElement(Demo));
    expect(document.querySelector('[data-id-tabar="react-bar"]')).toBeTruthy();

    unmount();
    expect(document.querySelector('[data-id-tabar="react-bar"]')).toBeNull();
  });

  it('exposes the live instance via bar()', () => {
    let getBar = null;
    function Demo() {
      const { ref, bar } = useTabar({ id: 'react-bar-2', trickle: false });
      getBar = bar;
      return createElement('div', { ref });
    }
    render(createElement(Demo));
    expect(getBar()).toBeTruthy();
    expect(getBar().id).toBe('react-bar-2');
  });

  it('re-renders reactively as the value changes', () => {
    function Demo() {
      const { ref, value } = useTabar({ id: 'react-reactive', trickle: false });
      return createElement(
        'div',
        null,
        createElement('div', { ref }),
        createElement('span', { 'data-testid': 'v' }, String(Math.round(value))),
      );
    }
    const { getByTestId } = render(createElement(Demo));
    expect(getByTestId('v').textContent).toBe('0');
    act(() => {
      Tabar.get('react-reactive').set(0.4, { animate: false });
    });
    expect(getByTestId('v').textContent).toBe('40');
  });
});
