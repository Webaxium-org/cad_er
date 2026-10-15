// Fixed seeds are evaluated once at module load, never during animation.
function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function createContours(seed, count = 16, aspect = .83) {
  const random = seeded(seed);
  const phase = random() * Math.PI * 2;
  let radius = 14;
  return Array.from({ length: count }, (_, level) => {
    radius += 10 + random() * 6;
    const points = Array.from({ length: 96 }, (_, index) => {
      const angle = index / 96 * Math.PI * 2;
      // All levels share a positive radial profile and center. Increasing the
      // radius preserves nesting instead of drifting adjacent contour families.
      const shape = 1 + .18 * Math.sin(2 * angle + phase)
        + .1 * Math.cos(3 * angle - phase) + .025 * Math.sin(5 * angle + phase);
      return [265 + Math.cos(angle) * radius * shape * 1.15,
        205 + Math.sin(angle) * radius * shape * aspect];
    });
    const point = (index) => points[(index + points.length) % points.length];
    let d = `M${points[0].join(' ')}`;
    points.forEach((p1, index) => {
      const p0 = point(index - 1), p2 = point(index + 1), p3 = point(index + 2);
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}`
        + ` ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2.join(' ')}`;
    });
    return { d: `${d} Z`, elevation: 840 + level * 5 };
  });
}

