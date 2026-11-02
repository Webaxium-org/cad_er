import { chainageMetres, groundProfile, interpolateGround } from "./waterWayGeometry.js";

const number = (value, name) => {
  if (value == null || String(value).trim() === "" || !Number.isFinite(Number(value))) throw Error(`Enter a valid ${name}.`);
  return Number(value);
};
const normalized = (row) => ({ ...row, offsets: (row.intermediateOffsets || []).map((point) => Number(point.offset)) });

export const validateProposalBreaks = (base, breaks = [], separator = "/") => {
  if (!Array.isArray(breaks) || breaks.length > 100) throw Error("Invalid proposal breaks.");
  const stations = new Set(base.rows.filter((row) => row.type === "Chainage").map((row) => row.chainage));
  let previousEnd = -Infinity;
  return [...breaks].sort((a, b) => chainageMetres(a.from, separator) - chainageMetres(b.from, separator)).map((entry) => {
    const from = chainageMetres(entry.from, separator), to = chainageMetres(entry.to, separator);
    if (!stations.has(entry.from) || !stations.has(entry.to) || to <= from || from < previousEnd) throw Error("Breaks must use existing chainages, in order, without overlap.");
    previousEnd = to;
    return { from: entry.from, to: entry.to, remark: String(entry.remark || "Proposal break").slice(0, 200) };
  });
};

// The optional design solver follows the report's area and average-end-area conventions.
// Legacy generation never calls it unless the user enables a new design operation.
export const proposalDesignQuantity = (survey, base, proposal, breaks = []) => {
  const totals = { cutting: 0, filling: 0 };
  const separator = survey.separator || "/";
  const proposedRows = new Map(proposal.rows.filter((row) => row.type === "Chainage").map((row) => [row.chainage, row]));
  let previous;
  for (const source of base.rows) {
    if (source.type === "Break") { previous = null; continue; }
    if (source.type !== "Chainage") continue;
    const row = proposedRows.get(source.chainage);
    if (!row) { previous = null; continue; }
    const ground = normalized(source), design = normalized(row);
    let cut = 0, fill = 0;
    const channel = survey.type === "Water Way" && proposal.proposalMethod !== "Bottom Width Fixed";
    if (channel) {
      const gp = groundProfile(source), dp = groundProfile(row);
      const xs = [...new Set([...gp, ...dp].map((point) => point.x).filter((x) => x >= dp[0].x && x <= dp.at(-1).x))].sort((a, b) => a - b);
      for (let index = 1; index < xs.length; index++) {
        const a = interpolateGround(gp, xs[index - 1]) - interpolateGround(dp, xs[index - 1]);
        const b = interpolateGround(gp, xs[index]) - interpolateGround(dp, xs[index]);
        const width = xs[index] - xs[index - 1];
        if (a * b < 0) {
          const left = width * Math.abs(a) / (Math.abs(a) + Math.abs(b));
          cut += a > 0 ? left * a / 2 : (width - left) * b / 2;
          fill += a < 0 ? -left * a / 2 : -(width - left) * b / 2;
        } else {
          cut += width * (Math.max(a, 0) + Math.max(b, 0)) / 2;
          fill += width * (Math.max(-a, 0) + Math.max(-b, 0)) / 2;
        }
      }
    } else {
      let previousCut = 0, previousFill = 0;
      design.offsets.forEach((x, index) => {
        const delta = Number(ground.reducedLevels[index] ?? 0) - Number(design.reducedLevels[index]);
        const c = Number(Math.max(delta, 0).toFixed(3)), f = Number(Math.max(-delta, 0).toFixed(3));
        const width = index ? Number((x - ground.offsets[index - 1]).toFixed(3)) : 0;
        cut += Number((Number((c > 0 && index ? (c + previousCut) / 2 : 0).toFixed(3)) * width).toFixed(3));
        fill += Number((Number((delta <= 0 && index ? (f + previousFill) / 2 : 0).toFixed(3)) * width).toFixed(3));
        previousCut = c; previousFill = f;
      });
      if (proposal.proposalMethod === "Bottom Width Fixed") {
        const center = Number(proposal.pls ?? base.pls ?? 0);
        const index = ground.offsets.reduce((closest, offset, i) => Math.abs(offset - center) < Math.abs(ground.offsets[closest] - center) ? i : closest, 0);
        const delta = Number(ground.reducedLevels[index]) - Math.min(...design.reducedLevels.map(Number));
        cut = Math.max(delta, 0) * Number(proposal.bottomWidth ?? proposal.width);
        fill = Math.max(-delta, 0) * Number(proposal.bottomWidth ?? proposal.width);
      }
    }
    const x = chainageMetres(source.chainage, separator);
    if (previous) {
      const excluded = breaks.some((range) => previous.x >= chainageMetres(range.from, separator) && x <= chainageMetres(range.to, separator));
      const distance = excluded ? 0 : channel ? x - previous.x : Number(source.chainage.split(separator)[1]) - previous.station;
      const cutAvg = (cut + previous.cut) / 2, fillAvg = (fill + previous.fill) / 2;
      totals.cutting += Number((distance * (channel ? cutAvg : Number(cutAvg.toFixed(3)))).toFixed(3));
      totals.filling += Number((distance * (channel ? fillAvg : Number(fillAvg.toFixed(3)))).toFixed(3));
    }
    previous = { x, station: Number(source.chainage.split(separator)[1]), cut: channel ? cut : Number(cut.toFixed(3)), fill: channel ? fill : Number(fill.toFixed(3)) };
  }
  return totals;
};

export const applyProposalWorkspace = (survey, base, seed, settings = {}) => {
  const draft = structuredClone(seed);
  const separator = survey.separator || "/";
  const breaks = validateProposalBreaks(base, settings.breaks || [], separator);
  const rows = draft.rows.filter((row) => row.type === "Chainage");
  if (!rows.length) throw Error("No chainage sections are available.");
  const center = Number(base.pls || 0);
  const first = chainageMetres(rows[0].chainage, separator);
  const slopeEnabled = Boolean(settings.ls?.enabled);
  const grade = slopeEnabled ? number(settings.ls.grade, "LS grade") / 100 : 0;
  const anchor = slopeEnabled && settings.ls.strategy === "anchor" ? number(settings.ls.anchorRl, "start RL") : null;
  const superElevation = settings.cs?.superelevationEnabled ? number(settings.cs.superelevation, "superelevation") / 100 : 0;
  let crossGrade = null;
  if (settings.cs?.slopeEnabled) {
    const h = number(settings.cs.horizontal, "horizontal CS slope"), v = number(settings.cs.vertical, "vertical CS slope");
    if (h <= 0 || v < 0) throw Error("CS slope must have positive horizontal run and non-negative rise, starting at 1:0.");
    crossGrade = v / h;
  }
  const seedStart = interpolateGround(groundProfile(rows[0]), center);
  rows.forEach((row) => {
    const oldCenter = interpolateGround(groundProfile(row), center);
    let target = oldCenter;
    if (settings.mode === "manual") target = number(settings.manualLevels?.[row.chainage], `RL at ${row.chainage}`);
    if (slopeEnabled) target = (anchor ?? seedStart) + grade * (chainageMetres(row.chainage, separator) - first);
    row.reducedLevels = row.reducedLevels.map((value, index) => {
      const offset = Number(row.intermediateOffsets[index].offset) - center;
      let next = Number(value) + target - oldCenter;
      if (crossGrade !== null) {
        const bedWidth = settings.template === "water" ? number(settings.cs.bedWidth, "flat bed width") : 0;
        if (bedWidth < 0) throw Error("Flat bed width must not be negative.");
        next = target + (settings.template === "water" ? 1 : -1) * Math.max(0, Math.abs(offset) - bedWidth / 2) * crossGrade;
      }
      return next + offset * superElevation;
    });
  });
  const shift = (amount) => ({ ...draft, rows: draft.rows.map((row) => row.type !== "Chainage" ? row : { ...row, reducedLevels: row.reducedLevels.map((value) => Number(value) + amount) }) });
  if (slopeEnabled && settings.ls.strategy !== "anchor") {
    const groundLevels = base.rows.filter((row) => row.type === "Chainage").flatMap((row) => row.reducedLevels.map(Number));
    const designLevels = rows.flatMap((row) => row.reducedLevels);
    let low = Math.min(...groundLevels) - Math.max(...designLevels) - 100;
    let high = Math.max(...groundLevels) - Math.min(...designLevels) + 100;
    const quantity = settings.ls.strategy === "minimum" ? 0 : number(settings.targetQuantity ?? seed.quantity, "target quantity");
    if (settings.ls.strategy === "quantity" && quantity < 0) throw Error("Target quantity must not be negative.");
    if (settings.ls.strategy === "quantity") {
      const key = settings.ls.quantityType === "cutting" ? "cutting" : "filling";
      const endQuantities = [proposalDesignQuantity(survey, base, shift(low), breaks)[key], proposalDesignQuantity(survey, base, shift(high), breaks)[key]];
      if (quantity > Math.max(...endQuantities)) throw Error("Target quantity cannot be reached within the available sections and proposal breaks.");
    }
    for (let iteration = 0; iteration < 65; iteration++) {
      if (settings.ls.strategy === "minimum") {
        const a = low + (high - low) / 3, b = high - (high - low) / 3;
        const qa = proposalDesignQuantity(survey, base, shift(a), breaks), qb = proposalDesignQuantity(survey, base, shift(b), breaks);
        if (qa.cutting + qa.filling < qb.cutting + qb.filling) high = b; else low = a;
      } else {
        const mid = (low + high) / 2;
        const q = proposalDesignQuantity(survey, base, shift(mid), breaks);
        const cutting = settings.ls.quantityType === "cutting";
        if (cutting ? q.cutting > quantity : q.filling < quantity) low = mid; else high = mid;
      }
    }
    draft.rows = shift((low + high) / 2).rows;
  }
  draft.rows.forEach((row) => {
    row.reducedLevels = row.reducedLevels.map((value) => {
      if (!Number.isFinite(Number(value))) throw Error("The design produced an invalid RL.");
      return Number(value).toFixed(3);
    });
  });
  draft.designSettings = { ...settings, breaks, version: 1 };
  return draft;
};
