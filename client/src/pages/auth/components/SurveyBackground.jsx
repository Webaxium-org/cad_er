import { useId } from "react";
import { createContours } from "./surveyGeometry";
import MountainTerrain from "./MountainTerrain";
import "./surveyBackground.css";

const banks = [createContours(31), createContours(87), createContours(146, 10, .45)];


function ContourBank({ contours, className }) {
  return (
    <svg className={`survey-contours ${className}`} viewBox="0 0 600 440" fill="none" focusable="false">
      {contours.map(({ d, elevation }, index) => (
        <path key={elevation} d={d} className={index % 4 === 0 ? "survey-index-contour" : undefined} />
      ))}
      {[6].filter((index) => index < contours.length).map((index) => (
        <path key={index} d={contours[index].d} pathLength="1000" className="survey-contour-highlight"
          style={{ animationDuration: "24s" }} />
      ))}
      <g className="survey-annotations">
        <path d="M264 205h12m-6-6v12 M260 222l10-17 10 17Z" />
        <text x="287" y="217">842.6</text>
      </g>
    </svg>
  );
}

export default function SurveyBackground() {
  const id = useId().replace(/:/g, "");
  return (
    <div className="survey-background" aria-hidden="true">
      <div className="survey-grid" />
      <ContourBank contours={banks[0]} className="survey-contours-left" />
      <ContourBank contours={banks[1]} className="survey-contours-right" />
      <ContourBank contours={banks[2]} className="survey-contours-edge" />
      <svg className="survey-coordinates" width="100%" height="100%" fill="none" focusable="false">
        <path d="M88 0V1200" /><path d="M0 20H2400" />
        <text x="104" y="28">416000 E</text><text x="48%" y="28">418000 E</text><text x="90%" y="28">420000 E</text>
        <text x="8" y="64">5458000 N</text><text x="8" y="42%">5456000 N</text>
        <text x="96%" y="64" textAnchor="end">5458000 N</text>
        <text x="96%" y="42%" textAnchor="end">5456000 N</text>
      </svg>
      <svg className="survey-markers" width="100%" height="100%" fill="none" focusable="false">
        <defs>
          <pattern id={`${id}-crosses`} width="260" height="210" patternUnits="userSpaceOnUse">
            <path d="M34 40h12m-6-6v12" />
            <circle cx="40" cy="40" r="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}-crosses)`} />
      </svg>
      <svg className="survey-control" viewBox="0 0 240 250" fill="none" focusable="false">
        <path className="survey-triangulation" d="M22 42L187 91 57 222 22 42 211 204 187 91M57 222L211 204" />
        <path d="M16 42h12m-6-6v12m158 43h14m-7-7v14M50 222l7-12 7 12Z" />
        <text x="35" y="35">E 482 650</text><text x="72" y="232">BM 02 · 128.45</text>
      </svg>
      <MountainTerrain />
      <div className="survey-content-mask" />
      <svg className="survey-total-station" viewBox="0 0 140 210" fill="none" focusable="false">
        <g strokeLinecap="round" strokeLinejoin="round" fill="#fff">
          {/* Opaque, closed silhouettes occlude the terrain and rear supports. */}
          <path d="M68 99h6l2 99h-6Z" />
          <path d="M61 100h7l-34 96h-6Z M77 100h7l29 96h-6Z" />
          <path d="M38 168l5 2m56-2 5-2M29 196l-2 7m86-7 2 7m-43-5v7" fill="none" />
          <rect x="56" y="91" width="33" height="10" rx="3" />
          <path d="M64 81h17v10H64Z" />
          <path d="M48 34q0-7 7-7h34q7 0 7 7v40q0 9-9 9H57q-9 0-9-9Z" />
          <path d="M55 27V17q0-7 7-7h20q7 0 7 7v10h-5V18q0-3-3-3H63q-3 0-3 3v9Z" />
          <rect x="39" y="32" width="48" height="28" rx="12" />
          <circle cx="52" cy="46" r="14" /><circle cx="52" cy="46" r="9" />
          <circle cx="52" cy="46" r="5" fill="#f3f1ff" />
          <rect x="65" y="62" width="22" height="14" rx="2" />
          <path d="M69 66h14v5H69Z M70 74h2m4 0h2m4 0h1" fill="none" />
          <circle cx="94" cy="58" r="3" />
        </g>
        <text x="80" y="207">STN 01</text>
      </svg>
    </div>
  );
}
