import { sectionPages } from "../../../utils/sectionDrawing";

export default function SectionSheet({ section, scales }) {
  let pages;
  try { pages = sectionPages(section, scales); }
  catch (error) { return <p role="alert">{error.message}</p>; }
  return pages.map((page, index) => <svg key={index} xmlns="http://www.w3.org/2000/svg"
    viewBox={`0 0 ${page.width} ${Math.min(page.height, Math.max(...page.commands.map((item) => item.kind === "line" ? Math.max(item.y1, item.y2) : item.y)) + 5)}`} role="img" aria-label={`Section drawing sheet ${index + 1}`}
    style={{ display: "block", width: "100%", background: "white" }}>
    {page.commands.map((item, i) => item.kind === "line"
      ? <line key={i} x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke={item.color || "black"} strokeWidth={item.width} />
      : <text key={i} x={item.x} y={item.y} fill={item.color || "black"} fontSize={item.size} fontFamily="Arial, sans-serif"
        textAnchor={item.align === "center" ? "middle" : item.align === "right" ? "end" : "start"}
        transform={item.angle ? `rotate(${-item.angle} ${item.x} ${item.y})` : undefined}>{item.value}</text>)}
  </svg>);
}
