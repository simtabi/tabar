import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TabarGroup } from '../src/group.js';

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '<div id="g"></div>';
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('TabarGroup', () => {
  it('renders an overall + children and aggregates them', () => {
    const group = new TabarGroup({ mountTo: '#g' });
    const a = group.add({ label: 'a' });
    const b = group.add({ label: 'b' });
    expect(group.children).toHaveLength(2);
    expect(document.querySelectorAll('.tabar-group__child')).toHaveLength(2);
    a.set(0.5, { animate: false });
    b.set(0.1, { animate: false });
    expect(group.overall.value).toBeCloseTo(30, 1); // equal-weight avg
    group.destroy();
    expect(document.querySelector('.tabar-group')).toBeNull();
  });

  it('bubbles child events and removes children', () => {
    const group = new TabarGroup({ mountTo: '#g' });
    const a = group.add({});
    let bubbled = 0;
    group.on('child:change', () => { bubbled += 1; });
    a.set(0.8, { animate: false });
    expect(bubbled).toBeGreaterThan(0);
    group.remove(a.id);
    expect(group.children).toHaveLength(0);
    group.destroy();
  });

  it('weights the overall by an explicit per-child weight', () => {
    const group = new TabarGroup({ mountTo: '#g', aggregate: 'weighted' });
    const a = group.add({ weight: 3 });
    const b = group.add({ weight: 1 });
    a.set(1, { animate: false }); // 100%
    b.set(0, { animate: false }); // 0%
    expect(group.overall.value).toBeCloseTo(75, 1); // (3*100 + 1*0) / 4
    group.destroy();
  });

  it('emits done when all children complete', async () => {
    const group = new TabarGroup({ mountTo: '#g' });
    let done = false;
    group.on('done', () => { done = true; });
    const a = group.add({ autoHide: false });
    const b = group.add({ autoHide: false });
    await a.done(true);
    await b.done(true);
    expect(done).toBe(true);
    group.destroy();
  });
});
