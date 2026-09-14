import SectionSheet from "./SectionSheet";

export default function CrossSectionChartV2({ selectedCs, drawingScales }) {
  return <SectionSheet section={selectedCs} scales={drawingScales} />;
}
