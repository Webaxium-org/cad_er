// Survey coordinates are metres; PDF dimensions are millimetres.
export const printedGraphScale = (area, widthMm, heightMm) => {
  const span = range => Array.isArray(range) && range.length === 2 &&
    range.every(value => value !== null && value !== "" && Number.isFinite(Number(value)))
    ? Math.abs(Number(range[1]) - Number(range[0])) : NaN;
  if (!area || (area.xType && area.xType !== "linear") || (area.yType && area.yType !== "linear")) return null;
  const horizontal = span(area.xRange) * 1000 / widthMm;
  const vertical = span(area.yRange) * 1000 / heightMm;
  return [widthMm, heightMm, horizontal, vertical].every(value => Number.isFinite(value) && value > 0)
    ? { horizontal, vertical } : null;
};

export const graphScaleLabel = scale => {
  if (!scale) return "Drawing scale unavailable";
  const format = value => value.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 3 });
  return `X scale 1:${format(scale.horizontal)}    Y scale 1:${format(scale.vertical)}`;
};
