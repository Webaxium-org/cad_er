import { groundProfile, interpolateGround } from "./waterWayGeometry.js";
const finite = (value, name) => {
  if (value == null || String(value).trim() === "" || !Number.isFinite(Number(value))) throw Error("Enter a valid " + name + ".");
  return Number(value);
};
export const csRatio = (value, name) => {
  const parts = String(value ?? "").trim().split(":");
  if (parts.length !== 2) throw Error(name + " must be V:H, for example 1:2.");
  const h = finite(parts[0], name), v = finite(parts[1], name);
  if (h <= 0 || v < 0) throw Error(name + " requires positive H and non-negative V.");
  return v / h;
};
export const csElevationBounds = (source, center, cs, water) => {
  const ground = groundProfile(source);
  const berm = finite(cs.berm ?? 0, "berm");
  const left = ground[0].x + berm, right = ground.at(-1).x - berm;
  if (berm < 0 || !(left < center && center < right)) throw Error("Berm leaves no section on both sides of the centre.");
  const lhs = csRatio(cs.lhs, "LHS slope"), rhs = csRatio(cs.rhs, "RHS slope");
  const l = interpolateGround(ground, left), r = interpolateGround(ground, right);
  const bounds = water
    ? { min: Math.max(l - (center - left) * lhs, r - (right - center) * rhs), max: Math.min(l, r) }
    : { min: Math.max(l, r), max: Math.min(l + (center - left) * lhs, r + (right - center) * rhs) };
  if (bounds.min > bounds.max) throw Error(`Chainage ${source.chainage}: side slopes cannot fit between left bank RL ${l.toFixed(3)} m (offset ${left.toFixed(3)} m) and right bank RL ${r.toFixed(3)} m (offset ${right.toFixed(3)} m). Check the surveyed readings or revise the side slopes.`);
  return bounds;
};
export const csSection = (source, row, center, target, cs, water, crossfall = 0) => {
  const ground = groundProfile(source), sign = water ? 1 : -1;
  const fixed = cs.fixedBottomEnabled;
  const lhs = csRatio(fixed ? cs.fixedLhs : cs.lhs, "LHS slope"), rhs = csRatio(fixed ? cs.fixedRhs : cs.rhs, "RHS slope");
  const berm = fixed ? 0 : finite(cs.berm ?? 0, "berm");
  if (berm < 0) throw Error("Berm cannot be negative.");
  const left = ground[0].x + berm, right = ground.at(-1).x - berm;
  if (!(left < center && center < right)) throw Error("Berm leaves no section on both sides of the centre.");
  let leftToe, rightToe;
  if (fixed) {
    const width = finite(cs.bottomWidth, "bottom width");
    if (width <= 0) throw Error("Bottom width must be greater than zero.");
    const origin = center + Number(cs.widthOffset || 0);
    leftToe = cs.widthSide === "rhs" ? origin : origin - (cs.widthSide === "lhs" ? width : width / 2);
    rightToe = cs.widthSide === "lhs" ? origin : origin + (cs.widthSide === "rhs" ? width : width / 2);
    if (leftToe < left || rightToe > right) throw Error("Bottom width exceeds the surveyed section.");
  } else {
    const dl = sign * (interpolateGround(ground, left) - target), dr = sign * (interpolateGround(ground, right) - target);
    if (dl < -1e-7 || dr < -1e-7) throw Error("Proposed centre RL is incompatible with the bank levels and slopes.");
    leftToe = lhs === 0 ? left : left + Math.max(0, dl) / lhs;
    rightToe = rhs === 0 ? right : right - Math.max(0, dr) / rhs;
    if ((lhs === 0 && Math.abs(dl) > 1e-7) || (rhs === 0 && Math.abs(dr) > 1e-7) || leftToe > center + 1e-7 || rightToe < center - 1e-7) throw Error("Side slopes do not fit between the surveyed edges and the centre RL.");
  }
  const xs = [...new Set([left, leftToe, center, rightToe, right, ...ground.map(p => p.x).filter(x => x >= left && x <= right)])].sort((a,b) => a-b);
  const levels = xs.map(x => target + sign * (x < leftToe ? (leftToe-x)*lhs : x > rightToe ? (x-rightToe)*rhs : 0) + (x-center)*crossfall - Math.abs(x-center) * (cs.camber || 0));
  return { ...row, roadWidth: String(right-left), intermediateOffsets: xs.map(x => ({ offset: String(x), is: "", mode: "S", remark: "" })), reducedLevels: levels };
};
