// Reserve room for full band labels without changing their text or font.
export const withSectionBandLabelMargin = (options, section) => {
  const layout = options.layout || {};
  const fontSize = Number(layout.xaxis?.tickfont?.size || layout.font?.size) || 12;
  const labels = [...(section.series || []).map((series) => series.name.replace(/^Proposed\s+/i, "Prop. ")), section.type === "ls" ? "Chainage" : "Offset"];
  const labelWidth = Math.ceil(Math.max(...labels.map((label) => label.length * fontSize * 0.65)) + 16);
  return { ...options, layout: { ...layout, margin: { ...layout.margin, l: Math.max(layout.margin?.l || 0, labelWidth) } } };
};

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
