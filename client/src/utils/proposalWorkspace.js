import { chainageValue, profileLevel, profilePoints } from "./surveyGeometry.js";

export const initialProposalDesign = {
  mode: "legacy", template: "road",
  ls: { enabled: false, grade: "0", strategy: "minimum", quantityType: "filling", anchorRl: "" },
  cs: { fixedBottomEnabled: false, bottomWidth: "", fixedLhs: "1:1", fixedRhs: "1:1", lhs: "1:1", rhs: "1:1", berm: "0", slopeEnabled: false, horizontal: "1", vertical: "0", bedWidth: "", superelevationEnabled: false, superelevation: "0" },
  dimensions: { length: "", width: "", height: "" }, manualLevels: {}, breaks: [],
  ssd: { enabled: false, speed: "", reaction: "2.5", deceleration: "3.4", grade: "0" },
};

// SI form of the reaction + grade-adjusted braking-distance equation.
// Reference: https://www.txdot.gov/manuals/des/rdw/chapter-4--basic-design-criteria/4-11-sight-distance.html
export const stoppingSightDistance = ({ speed, reaction, deceleration, grade }) => {
  const values = [speed, reaction, deceleration, grade];
  if (values.some((value) => value == null || String(value).trim() === "" || !Number.isFinite(Number(value)))) return null;
  const v = Number(speed) / 3.6, t = Number(reaction), a = Number(deceleration), g = Number(grade) / 100;
  if (v <= 0 || t <= 0 || a <= 0 || a + 9.81 * g <= 0) return null;
  return v * t + v * v / (2 * (a + 9.81 * g));
};

export const proposalGraphSeries = (base, proposed, type, selectedChainage, separator = "/") => {
  if (!base) return [];
  const center = Number(base.pls || 0);
  return [base, proposed].filter(Boolean).map((purpose, index) => {
    const rows = purpose.rows || [];
    let points;
    if (type === "cs") {
      const row = rows.find((entry) => entry.type === "Chainage" && entry.chainage === selectedChainage);
      points = row ? profilePoints(row.offsets, row.reducedLevels) : [];
    } else {
      points = [];
      let previousX;
      rows.forEach((row) => {
        if (row.type === "Break") { points.push(null); return; }
        if (row.type !== "Chainage") return;
        const x = chainageValue(row.chainage, separator);
        if (previousX != null && purpose.designSettings?.breaks?.some((range) => previousX >= chainageValue(range.from, separator) && x <= chainageValue(range.to, separator))) points.push(null);
        const y = profileLevel(profilePoints(row.offsets, row.reducedLevels), center);
        points.push(Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null);
        previousX = x;
      });
    }
    return { name: purpose.type || (index ? "Proposed Level" : "Initial Level"), color: index ? "#595cf2" : "#16845f", points };
  });
};

export const graphTicks = (minimum, maximum, count = 6) => {
  const raw = Math.max(maximum - minimum, 0.0001) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].find((value) => value * power >= raw) * power;
  const ticks = [];
  for (let value = Math.ceil(minimum / step) * step; value <= maximum + step * 0.001 && ticks.length < 30; value += step) ticks.push(Number(value.toFixed(6)));
  return ticks;
};
