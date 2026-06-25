import { afterEach, describe, expect, it } from 'vitest';
import { Tabar } from '../src/tabar.js';
import '../src/element.js'; // defines <tabar-bar>

afterEach(() => {
  document.body.innerHTML = '';
  for (const bar of Tabar.instances) bar.destroy();
});

describe('<tabar-bar> web component', () => {
  it('coerces the expanded attribute surface onto the Tabar instance', () => {
    const el = document.createElement('tabar-bar');
    el.setAttribute('tooltip', 'true');
    el.setAttribute('length', '50%');
    el.setAttribute('colors', '#f00,#0f0,#00f');
    el.setAttribute('color-mode', 'bands');
    el.setAttribute('line-cap', 'butt');
    el.setAttribute('start-angle', '45');
    el.setAttribute('clockwise', 'false');
    document.body.appendChild(el); // connectedCallback builds the bar
    const bar = el.bar;
    expect(bar.options.tooltip).toBe(true);
    expect(bar.options.length).toBe('50%');
    expect(bar.options.colors).toEqual(['#f00', '#0f0', '#00f']);
    expect(bar.options.colorMode).toBe('bands');
    expect(bar.options.lineCap).toBe('butt');
    expect(bar.options.startAngle).toBe(45);
    expect(bar.options.clockwise).toBe(false);
  });

  it('reconfigures live on attribute change', () => {
    const el = document.createElement('tabar-bar');
    document.body.appendChild(el);
    el.setAttribute('color-mode', 'bands');
    expect(el.bar.options.colorMode).toBe('bands');
  });

  it('parses a colors attribute with functional colors (commas inside parens)', () => {
    const el = document.createElement('tabar-bar');
    el.setAttribute('colors', 'rgb(255, 0, 0), #00ff00, hsl(200, 50%, 50%)');
    document.body.appendChild(el);
    expect(el.bar.options.colors).toEqual(['rgb(255, 0, 0)', '#00ff00', 'hsl(200, 50%, 50%)']);
  });
});
