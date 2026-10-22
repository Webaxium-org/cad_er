import { chainageValue, profileLevel } from "./surveyGeometry.js";

// Use the same three-decimal profile shift for the preview and saved payload.
export const shiftReducedLevels = (levels, delta) => levels.map((level) => (Number(level) + delta).toFixed(3));

export const previewLongitudinalPurposes = (purposes, levelRows, edits) => {
  const deltas = new Map();
  levelRows.forEach((row) => row.sources.forEach((source, index) => {
    const value = edits[`${row.id}-${index}`];
    if (!source.row || !Number.isFinite(row.levels[index]) || value === undefined
      || String(value).trim() === "" || !Number.isFinite(Number(value))) return;
    deltas.set(String(source.row._id), Number(value) - row.levels[index]);
  }));
  return purposes.map((purpose) => ({
    ...purpose,
    rows: purpose.rows?.map((row) => deltas.has(String(row._id))
      ? { ...row, reducedLevels: shiftReducedLevels(row.reducedLevels, deltas.get(String(row._id))) }
      : row),
  }));
};

// Anchor at the current RL at the start, then set a straight 1:N grade.
export const buildSlopeEdits = ({ rows, levelIndex, from, to, denominator, direction = "falling", separator = "/", edits = {}, breakChainages = [] }) => {
  const start = chainageValue(from, separator);
  const end = chainageValue(to, separator);
  const ratio = Number(denominator);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error("Enter a valid chainage range with the end after the start.");
  if (String(denominator).trim() === "" || !Number.isFinite(ratio) || ratio <= 0) throw new Error("Enter a slope denominator greater than zero.");
  if (!["falling", "rising"].includes(direction)) throw new Error("Select a rising or falling slope.");
  if (breakChainages.some((chainage) => chainage > start && chainage <= end)) throw new Error("This range crosses a survey break. Apply a separate slope on each side.");
  const samples = rows.map((row) => {
    const value = edits[`${row.id}-${levelIndex}`] ?? row.levels[levelIndex];
    const source = row.sources[levelIndex]?.row;
    const valid = value !== null && value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value))
      && source?.reducedLevels?.length > 0 && source.reducedLevels.every((level) =>
        level !== null && level !== undefined && String(level).trim() !== "" && Number.isFinite(Number(level)));
    return { row, x: chainageValue(row.chainage, separator), y: valid ? Number(value) : null };
  }).sort((a, b) => a.x - b.x);
  if (!samples.length || start < samples[0].x || end > samples.at(-1).x) throw new Error("Keep the range within the report's chainages.");
  // Include bounding samples used for interpolation so missing RLs cannot be bridged.
  const before = samples.findLast((point) => point.x <= start);
  const after = samples.find((point) => point.x >= end);
  const covered = samples.filter((point) => point.x >= before.x && point.x <= after.x);
  if (covered.some((point) => point.y === null)) throw new Error("This range contains missing or invalid RLs. Resolve them before applying a slope.");
  const startRl = profileLevel(covered, start);
  if (!Number.isFinite(startRl)) throw new Error("A valid starting RL is required.");
  const sign = direction === "rising" ? 1 : -1;
  const endRl = startRl + sign * (end - start) / ratio;
  if (!Number.isFinite(endRl)) throw new Error("This slope produces an invalid RL. Enter a larger denominator.");
  const changes = {};
  samples.filter((point) => point.x >= start && point.x <= end).forEach(({ row, x }) => {
    changes[`${row.id}-${levelIndex}`] = (startRl + sign * (x - start) / ratio).toFixed(3);
  });
  if (!Object.keys(changes).length) throw new Error("There are no surveyed chainages inside this range.");
  return { edits: changes, startRl, endRl, start, end };
};
