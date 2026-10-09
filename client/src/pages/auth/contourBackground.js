const contourPath = (cx, cy, rx, ry, phase) => {
  const points = Array.from({ length: 97 }, (_, index) => {
    const angle = (index / 96) * Math.PI * 2;
    const variation = 1 + 0.065 * Math.sin(3 * angle + phase) +
      0.035 * Math.cos(5 * angle - phase) + 0.02 * Math.sin(9 * angle + phase);
    return `${index ? "L" : "M"}${(cx + Math.cos(angle) * rx * variation).toFixed(1)} ${(cy + Math.sin(angle) * ry * variation).toFixed(1)}`;
  });
  return `${points.join(" ")} Z`;
};

export const contourPaths = [
  [290, 410, 32, 26, 0.4, 12],
  [1030, 120, 45, 34, 1.7, 9],
  [1040, 820, 36, 30, 2.5, 10],
].flatMap(([cx, cy, startX, startY, phase, count]) =>
  Array.from({ length: count }, (_, index) =>
    contourPath(cx, cy, startX + index * 35, startY + index * 30, phase)
  )
);
