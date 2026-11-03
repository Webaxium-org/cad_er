// Map equally sized table columns onto their actual (possibly unequal) station spacing.
export const chainageTableViewport = (chainages, scrollLeft, viewportWidth, labelWidth = 88, columnWidth = 104) => {
  if (chainages.length < 2 || viewportWidth <= labelWidth || columnWidth <= 0
    || !chainages.every(Number.isFinite)) return null;
  const at = (index) => {
    const left = Math.max(0, Math.min(chainages.length - 2, Math.floor(index)));
    return chainages[left] + (chainages[left + 1] - chainages[left]) * (index - left);
  };
  const visible = (viewportWidth - labelWidth) / columnWidth;
  const start = Math.max(0, Math.min(scrollLeft / columnWidth, Math.max(0, chainages.length - visible)));
  const end = Math.min(chainages.length, start + visible);
  const range = [at(start - 0.5), at(end - 0.5)];
  return range[1] > range[0] ? range : null;
};
