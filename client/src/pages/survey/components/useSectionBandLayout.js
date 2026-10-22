import { useCallback, useState } from "react";

export default function useSectionBandLayout(enabled) {
  const [layout, setLayout] = useState(null);
  const updateLayout = useCallback((_, graph) => {
    if (!enabled) return;
    const full = graph?._fullLayout;
    if (!full?._size || !full.xaxis?.range) return;
    const next = { width: full.width, left: full._size.l, plotWidth: full._size.w, range: full.xaxis.range.map(Number) };
    setLayout((previous) => previous && previous.width === next.width && previous.left === next.left
      && previous.plotWidth === next.plotWidth && previous.range.every((value, index) => value === next.range[index]) ? previous : next);
  }, [enabled]);
  return [layout, updateLayout];
}
