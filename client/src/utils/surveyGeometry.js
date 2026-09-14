const numeric = (value) => value !== null && value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value));

export const profilePoints = (offsets = [], levels = []) => offsets
  .map((x, i) => ({ x, y: levels[i] }))
  .filter((p) => numeric(p.x) && numeric(p.y))
  .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
  .sort((a, b) => a.x - b.x);

// No endpoint extrapolation: absent coverage is missing data, not zero RL.
export const profileLevel = (points, x) => {
  if (!numeric(x) || !points.length || x < points[0].x || x > points.at(-1).x) return null;
  const exact = points.find((p) => p.x === Number(x));
  if (exact) return exact.y;
  const index = points.findIndex((p) => p.x > x);
  if (index < 1) return null;
  const a = points[index - 1], b = points[index];
  return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
};

export const chainageValue = (value, separator = "/") => {
  const parts = String(value ?? "").split(separator);
  if (parts.some((part) => !numeric(part)) || parts.length > 2) return NaN;
  return parts.length === 2 ? Number(parts[0]) * 1000 + Number(parts[1]) : Number(parts[0]);
};

// Common breakpoints, including zero-depth crossings, for exact piecewise-linear areas.
export const compareProfiles = (initialRow, proposedRow) => {
  const ground = profilePoints(initialRow?.offsets, initialRow?.reducedLevels);
  const design = profilePoints(proposedRow?.offsets, proposedRow?.reducedLevels);
  if (ground.length < 2 || design.length < 2) return [];
  if (ground.length !== initialRow.offsets.length || design.length !== proposedRow.offsets.length) return [];
  const lo = design[0].x, hi = design.at(-1).x;
  if (ground[0].x > lo || ground.at(-1).x < hi) return [];
  const offsets = [...new Set([...ground, ...design].map((p) => p.x).filter((x) => x >= lo && x <= hi))].sort((a, b) => a - b);
  const sample = (x) => ({ x, initial: profileLevel(ground, x), proposed: profileLevel(design, x) });
  const points = offsets.map(sample), result = [];
  points.forEach((point, i) => {
    const prev = points[i - 1];
    if (prev) {
      const a = prev.initial - prev.proposed, b = point.initial - point.proposed;
      if (a * b < 0) result.push(sample(prev.x + (point.x - prev.x) * a / (a - b)));
    }
    result.push(point);
  });
  return result.map((point, i) => {
    const prev = result[i - 1] || point;
    const width = point.x - prev.x;
    const cut = Math.max(point.initial - point.proposed, 0), fill = Math.max(point.proposed - point.initial, 0);
    const cutAvg = i ? (cut + Math.max(prev.initial - prev.proposed, 0)) / 2 : 0;
    const fillAvg = i ? (fill + Math.max(prev.proposed - prev.initial, 0)) / 2 : 0;
    return {
      offset: point.x.toFixed(6), initialEntryRL: point.initial.toFixed(3), secondaryEntryRL: point.proposed.toFixed(3),
      cuttingMtr: cut.toFixed(3), fillingMtr: fill.toFixed(3),
      cuttingAvgMtr: cutAvg.toFixed(3), fillingAvgMtr: fillAvg.toFixed(3),
      cuttingWMtr: width.toFixed(3), fillingWMtr: width.toFixed(3),
      cuttingAreaSqMtr: cutAvg * width, fillingAreaSqMtr: fillAvg * width,
    };
  });
};
