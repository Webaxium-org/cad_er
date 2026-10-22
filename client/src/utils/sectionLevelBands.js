export const getSectionLevelBands = (section) => {
  const positions = new Set();
  const bands = [...(section.series || [])].reverse().map((series) => {
    const values = new Map();
    for (const point of series.data || []) {
      if (point.x === null || point.x === undefined || point.x === "") continue;
      const x = Number(point.x);
      if (!Number.isFinite(x)) continue;
      positions.add(x);
      if (point.y === null || point.y === undefined || point.y === "" || !Number.isFinite(Number(point.y))) continue;
      const levels = values.get(x) || [];
      const value = Number(point.y).toFixed(3);
      if (!levels.includes(value)) levels.push(value);
      values.set(x, levels);
    }
    return { name: series.name, color: series.color || "#000000", values };
  });
  const ordered = [...positions].sort((a, b) => a - b);
  return [...bands, { name: section.type === "ls" ? "Chainage" : "Offset", color: "#000000", values: new Map(ordered.map((x) => [x, [x.toFixed(3)]])) }];
};
