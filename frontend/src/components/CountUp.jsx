import React, { useEffect, useState } from 'react';

/**
 * High-Performance Animated Number Counter
 * Eliminates CJS/ESM module resolution conflicts (where 'react-countup' resolves to a plain object)
 * by providing a native requestAnimationFrame 60fps number animation.
 */
export default function CountUp({
  start = 0,
  end = 0,
  duration = 1.5,
  decimals = 0,
  separator = ',',
  prefix = '',
  suffix = '',
  preserveValue = false,
}) {
  const target = Number(end) || 0;
  const initial = Number(start) || 0;
  const [displayValue, setDisplayValue] = useState(preserveValue ? target : initial);

  useEffect(() => {
    let startTimestamp = null;
    let animId = null;
    const diff = target - initial;
    const durationMs = Math.max((duration || 1.5) * 1000, 200);

    // Ease-out cubic transition for smooth rolling effect
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const eased = easeOutCubic(progress);
      const current = initial + diff * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, initial, duration]);

  // Format with localized numbering and specified decimals
  const formatted = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export { CountUp };
