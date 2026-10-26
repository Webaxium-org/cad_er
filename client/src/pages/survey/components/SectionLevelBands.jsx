import { Box } from "@mui/material";
import { getSectionLevelBands } from "../../../utils/sectionLevelBands";

export default function SectionLevelBands({ section, layout }) {
  if (!layout || !section.series?.length) return null;
  const { width, left, plotWidth, range, fontSize = 12 } = layout;
  const span = range[1] - range[0] || 1;
  let top = 14;
  const bands = getSectionLevelBands(section).map((band) => {
    const points = [...band.values].map(([x, levels]) => ({ x: left + (x - range[0]) / span * plotWidth, label: levels.join(" / ") }))
      .filter((point) => point.x >= left - 0.01 && point.x <= left + plotWidth + 0.01).sort((a, b) => a.x - b.x);
    // Close offsets use separate vertical tiers rather than overlapping labels.
    const tierEnds = [];
    points.forEach((point) => {
      let tier = tierEnds.findIndex((lastX) => point.x - lastX >= fontSize + 2);
      if (tier < 0) tier = tierEnds.length;
      tierEnds[tier] = point.x;
      point.tier = tier;
    });
    const tierHeight = Math.max(54, ...points.map((point) => point.label.length * fontSize * .6 + 12));
    const height = Math.max(1, tierEnds.length) * tierHeight + 18;
    const result = { ...band, points, top, height, tierHeight };
    top += height;
    return result;
  });
  return (
    <Box sx={{ width: "100%", bgcolor: "white", breakInside: "avoid", lineHeight: 0, "@media print": { printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${top + 1}`} width="100%" role="img" aria-label={`${section.type === "ls" ? "Longitudinal" : "Cross"} section reduced level and ${section.type === "ls" ? "chainage" : "offset"} bands`} style={{ display: "block", height: "auto", fontFamily: "Arial, sans-serif", overflow: "visible" }}>
        <rect width={width} height={top + 1} fill="white" />
        {bands.map((band, index) => {
          const label = band.name.replace(/^Proposed\s+/i, "Prop. ");
          return <g key={index} fill={band.color}>
            <line x1={left} x2={left + plotWidth} y1={band.top + 5} y2={band.top + 5} stroke={band.color} strokeWidth="1.3" />
            <text x={left - 8} y={band.top + 5} fontSize={fontSize} textAnchor="end">
              {label}
            </text>
            {band.points.map((point, pointIndex) => {
              const y = band.top + 19 + point.tier * band.tierHeight;
              return <g key={pointIndex}>
                <text x={point.x} y={y} transform={`rotate(-90 ${point.x} ${y})`} textAnchor="end" fontSize={fontSize}>{point.label}</text>
              </g>;
            })}
          </g>;
        })}
      </svg>
    </Box>
  );
}
