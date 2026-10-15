import logo from "../assets/logo/cader_logo_2.png";
import "./caderBrand.css";

export default function CaderBrand({ iconSrc = logo }) {
  return (
    <span className="cader-brand">
      <img className="cader-brand-icon" src={iconSrc} alt="" />
      <svg className="cader-brand-copy" viewBox="0 0 160 54" role="img"
        aria-label="CADER — Complexity simplified">
        <text className="cader-brand-name" x="0" y="32" textLength="160" lengthAdjust="spacingAndGlyphs">
          <tspan>CAD</tspan><tspan className="cader-brand-accent">ER</tspan>
        </text>
        <text className="cader-brand-tagline" x="2" y="49" textLength="158" lengthAdjust="spacingAndGlyphs">
          Complexity simplified
        </text>
      </svg>
    </span>
  );
}
