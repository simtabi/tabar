/**
 * useTabar — a small, reactive React hook around Tabar.
 *
 *   import { useTabar } from '@simtabi/tabar/react';
 *
 *   function Loader() {
 *     const { ref, bar, value, stats } = useTabar({ color: '#e91e63', height: 6 });
 *     return (
 *       <>
 *         <div ref={ref} />
 *         <button onClick={() => bar()?.start()}>Start</button>
 *         <span>{Math.round(value)}%</span>
 *       </>
 *     );
 *   }
 *
 * `react` is a peer dependency — only imported when you use this entry point.
 */
import { useEffect, useRef, useState } from 'react';
import Tabar from './tabar.js';

/**
 * Mount one inline Tabar into a ref'd element. The returned `value`/`state`/`stats`
 * update reactively; `bar()` exposes the live instance for the full imperative API.
 *
 * @param {object} [options] Tabar options (position defaults to 'inline').
 */
export function useTabar(options = {}) {
  const ref = useRef(null);
  const barRef = useRef(null);
  const [snapshot, setSnapshot] = useState({ value: 0, state: 'idle', stats: null });

  useEffect(() => {
    if (!ref.current) return undefined;
    const bar = new Tabar({ ...options, position: options.position || 'inline', mountTo: ref.current });
    barRef.current = bar;

    const sync = () =>
      setSnapshot({ value: bar.value, state: bar.state, stats: bar.stats, complete: bar.complete });
    ['change', 'progress', 'reset', 'done', 'indeterminate', 'error', 'warning', 'success'].forEach(
      (e) => bar.on(e, sync),
    );
    sync();

    return () => {
      bar.destroy();
      barRef.current = null;
    };
    // Mount once; drive the bar imperatively via the returned getter.
  }, []);

  return {
    ref,
    bar: () => barRef.current,
    value: snapshot.value,
    state: snapshot.state,
    stats: snapshot.stats,
    complete: snapshot.complete,
  };
}

export default useTabar;
