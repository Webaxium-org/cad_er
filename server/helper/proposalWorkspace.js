import { csSection, csRatio } from "./proposalCsGeometry.js";
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
    const channel = proposal.csGeometry || (survey.type === "Water Way" && proposal.proposalMethod !== "Bottom Width Fixed");
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
  if (settings.cs?.fixedBottomEnabled && settings.cs?.slopeEnabled) throw Error("Choose either Fixed bottom width or CS slope.");
  const waterTemplate = settings.template ? settings.template === "water" : survey.type === "Water Way";
  const csGeometry = Boolean(settings.cs?.fixedBottomEnabled || (settings.cs?.slopeEnabled && settings.cs?.lhs != null));
  const sourceRows = new Map(base.rows.map(row => [row.chainage, row]));
  if (csGeometry) draft.csGeometry = true;
  const first = chainageMetres(rows[0].chainage, separator);
  const slopeEnabled = Boolean(settings.ls?.enabled);
  const customSlope = slopeEnabled && settings.ls.strategy === "custom";
  const grade = slopeEnabled && !customSlope ? number(settings.ls.grade, "LS grade") / 100 : 0;
  const anchor = slopeEnabled && settings.ls.strategy === "anchor" ? number(settings.ls.anchorRl, "start RL") : null;
  const superElevation = settings.cs?.superelevationEnabled ? number(settings.cs.superelevation, "superelevation") / 100 : 0;
  let crossGrade = null;
  if (settings.cs?.slopeEnabled && !csGeometry) {
    const h = number(settings.cs.horizontal, "horizontal CS slope"), v = number(settings.cs.vertical, "vertical CS slope");
    if (h <= 0 || v < 0) throw Error("CS slope must have positive horizontal run and non-negative rise, starting at 1:0.");
    crossGrade = v / h;
  }
  const seedStart = interpolateGround(groundProfile(rows[0]), center);
  const customSegments = [];
  if (customSlope) {
    const input = settings.ls.custom || {};
    let segments = input.segments;
    if (segments === undefined) {
      const denominator = number(input.denominator, "slope ratio");
      if (denominator <= 0 || !["rising", "falling"].includes(input.direction)) throw Error("Invalid custom slope range, direction or ratio.");
      segments = [{ from: input.from, to: input.to, grade: (input.direction === "falling" ? -1 : 1) * 100 / denominator }];
    }
    if (!Array.isArray(segments) || !segments.length || segments.length > 100) throw Error("Enter between 1 and 100 custom slope segments.");
    for (const segment of segments) {
      if (!segment || typeof segment !== "object") throw Error("Invalid custom slope segment.");
      const start = rows.find(row => row.chainage === segment.from), end = rows.find(row => row.chainage === segment.to);
      if (!start || !end) throw Error("Custom slope endpoints must be within the proposal chainages.");
      const from = chainageMetres(segment.from, separator), to = chainageMetres(segment.to, separator);
      const grade = number(segment.grade, "custom slope") / 100;
      const previous = customSegments.at(-1);
      if (to <= from || (previous && from < previous.to)) throw Error("Custom slope segments must be in increasing order without overlap.");
      const startIndex = base.rows.findIndex(row => row.type === "Chainage" && row.chainage === segment.from);
      const endIndex = base.rows.findIndex(row => row.type === "Chainage" && row.chainage === segment.to);
      if (breaks.some(range => chainageMetres(range.from, separator) < to && chainageMetres(range.to, separator) > from)
        || base.rows.slice(startIndex + 1, endIndex).some(row => row.type === "Break")) throw Error("Custom slope cannot cross a proposal break.");
      const startLevel = previous && from === previous.to
        ? previous.start + previous.grade * (previous.to - previous.from)
        : interpolateGround(groundProfile(start), center);
      customSegments.push({ from, to, start: startLevel, grade });
    }
  }
  rows.forEach((row) => {
    const oldCenter = interpolateGround(groundProfile(row), center);
    let target = oldCenter;
    if (settings.mode === "manual") target = number(settings.manualLevels?.[row.chainage], `RL at ${row.chainage}`);
    if (slopeEnabled && !customSlope) target = (anchor ?? seedStart) + grade * (chainageMetres(row.chainage, separator) - first);
    if (customSlope) {
      const position = chainageMetres(row.chainage, separator);
      const segment = customSegments.find(entry => position >= entry.from && position <= entry.to);
      if (segment) target = segment.start + segment.grade * (position - segment.from);
    }
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
  if (csGeometry) rows.forEach(row => Object.assign(row, csSection(sourceRows.get(row.chainage), row, center, interpolateGround(groundProfile(row), center), settings.cs, waterTemplate, superElevation)));
  const shift = (amount) => ({ ...draft, rows: draft.rows.map((row) => row.type !== "Chainage" ? row : csGeometry ? csSection(sourceRows.get(row.chainage), row, center, interpolateGround(groundProfile(row), center) + amount, settings.cs, waterTemplate, superElevation) : { ...row, reducedLevels: row.reducedLevels.map((value) => Number(value) + amount) }) });
  const conditionQuantity = settings.mode !== "manual" && !slopeEnabled && settings.ls?.quantityType
    && settings.ls.quantityType !== (survey.type === "Water Way" ? "cutting" : "filling");
  const strategy = conditionQuantity ? "quantity" : settings.ls?.strategy;
  if (conditionQuantity || (slopeEnabled && !customSlope && strategy !== "anchor")) {
    const groundLevels = base.rows.filter((row) => row.type === "Chainage").flatMap((row) => row.reducedLevels.map(Number));
    const designLevels = rows.flatMap((row) => row.reducedLevels);
    let low = Math.min(...groundLevels) - Math.max(...designLevels) - 100;
    let high = Math.max(...groundLevels) - Math.min(...designLevels) + 100;
    if (csGeometry && !settings.cs.fixedBottomEnabled) {
      const sign = waterTemplate ? 1 : -1;
      const lhs = csRatio(settings.cs.lhs, "LHS slope"), rhs = csRatio(settings.cs.rhs, "RHS slope");
      for (const row of rows) {
        const gp = groundProfile(sourceRows.get(row.chainage));
        const left = gp[0].x + Number(settings.cs.berm || 0), right = gp.at(-1).x - Number(settings.cs.berm || 0);
        const l = interpolateGround(gp, left), r = interpolateGround(gp, right), current = interpolateGround(groundProfile(row), center);
        const minimum = sign > 0 ? Math.max(l-(center-left)*lhs, r-(right-center)*rhs) : Math.max(l,r);
        const maximum = sign > 0 ? Math.min(l,r) : Math.min(l+(center-left)*lhs, r+(right-center)*rhs);
        low = Math.max(low, minimum-current); high = Math.min(high, maximum-current);
      }
      if (low > high) throw Error("No profile elevation fits the selected side slopes and berm.");
    }
    const quantity = strategy === "minimum" ? 0 : number(settings.targetQuantity ?? seed.quantity, "target quantity");
    if (strategy === "quantity" && quantity < 0) throw Error("Target quantity must not be negative.");
    if (strategy === "quantity") {
      const key = settings.ls.quantityType === "cutting" ? "cutting" : "filling";
      const endQuantities = [proposalDesignQuantity(survey, base, shift(low), breaks)[key], proposalDesignQuantity(survey, base, shift(high), breaks)[key]];
      if (quantity > Math.max(...endQuantities)) throw Error("Target quantity cannot be reached within the available sections and proposal breaks.");
    }
    for (let iteration = 0; iteration < 65; iteration++) {
      if (strategy === "minimum") {
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
