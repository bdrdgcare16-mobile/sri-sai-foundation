import { useEffect, useRef, useState } from 'react';

// Scroll-driven effects are skipped entirely when the visitor has asked the OS
// to reduce motion, so content still renders immediately.
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * One shared, rAF-throttled scroll listener drives every reveal on the page.
 *
 * This deliberately does not use IntersectionObserver: an observer only fires
 * when the intersection ratio crosses a threshold, so an element that moves
 * from below the viewport to above it in a single jump — a reload that
 * restores scroll position, an anchor jump, a fast programmatic scroll —
 * never fires and stays invisible forever. A position check has no such gap,
 * because "already scrolled past" reads as a negative `top`.
 */
const watchers = new Set();
let listening = false;
let frame = 0;

const TRIGGER_OFFSET = 60;

const flush = () => {
  frame = 0;
  for (const watcher of [...watchers]) {
    const rect = watcher.el.getBoundingClientRect();
    if (rect.top < window.innerHeight - TRIGGER_OFFSET) {
      watchers.delete(watcher);
      watcher.fire();
    }
  }
  if (watchers.size === 0 && listening) {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    listening = false;
  }
};

function schedule() {
  if (!frame) frame = window.requestAnimationFrame(flush);
}

/** Calls `fire` once the element reaches the trigger line. Returns an unsubscribe. */
function watch(el, fire) {
  const watcher = { el, fire };
  watchers.add(watcher);

  if (!listening) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    listening = true;
  }

  // Evaluate immediately so content already on screen never waits for a scroll.
  schedule();

  return () => {
    watchers.delete(watcher);
    if (watchers.size === 0 && listening) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      listening = false;
    }
  };
}

/** Reveals its children once they reach the trigger line. */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  variant = 'up',
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return undefined;

    if (prefersReducedMotion()) {
      setShown(true);
      return undefined;
    }

    return watch(el, () => setShown(true));
  }, [shown]);

  const classes = ['reveal', `reveal-${variant}`, shown ? 'is-visible' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={ref}
      className={classes}
      // Scoped to the reveal animation only, so card hover stays instant.
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts from zero to `to` the first time it reaches the trigger line.
 * Reduced-motion visitors simply get the final value.
 */
export function CountUp({ to, duration = 1300, suffix = '', className = '' }) {
  const ref = useRef(null);
  const [value, setValue] = useState(() => (prefersReducedMotion() ? to : 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (prefersReducedMotion()) {
      setValue(to);
      return undefined;
    }

    let raf = 0;
    let start = 0;

    const step = (now) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic keeps the tail of the count from feeling mechanical.
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = window.requestAnimationFrame(step);
    };

    const unwatch = watch(el, () => {
      // Scrolled well past already: show the figure instead of replaying it.
      if (el.getBoundingClientRect().bottom < 0) {
        setValue(to);
        return;
      }
      raf = window.requestAnimationFrame(step);
    });

    return () => {
      unwatch();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
