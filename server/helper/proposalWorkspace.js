import { csSection, csElevationBounds } from "./proposalCsGeometry.js";
import { chainageMetres, groundProfile, interpolateGround } from "./waterWayGeometry.js";
import { roundProposalLevels } from "./proposalRounding.js";

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
  // A fixed-width water section can represent either an excavated channel or
  // a filled embankment. The design condition determines the side direction.
  const channelShape = waterTemplate && !(settings.cs?.fixedBottomEnabled && settings.ls?.quantityType === "filling");
  const csGeometry = Boolean(settings.cs?.fixedBottomEnabled || (settings.cs?.slopeEnabled && settings.cs?.lhs != null));
  const camber = settings.cs?.camberEnabled ? number(settings.cs.camber, "camber") / 100 : 0;
  const sectionSettings = row => {
    const cs = { ...settings.cs, camber };
    const width = cs.fixedBottomEnabled;
    const custom = cs[width ? "widthMode" : "slopeMode"] === "custom";
    const ranges = custom ? cs[width ? "widthRanges" : "slopeRanges"] : [cs];
    if (!Array.isArray(ranges) || !ranges.length) throw Error("Add at least one cross-section range.");
    let matched = !custom;
    for (const entry of ranges) {
      if (custom && !(width && entry.from === "all")) {
        const from = rows.findIndex(r => r.chainage === entry.from), to = rows.findIndex(r => r.chainage === entry.to);
        if (from < 0 || to <= from) throw Error("Choose increasing start and end chainages for each cross-section range.");
        const index = rows.findIndex(r => r.chainage === row.chainage);
        if (index < from || index > to) continue;
      }
      matched = true;
      const side = entry.side || "all";
      if (!["all", "lhs", "rhs"].includes(side)) throw Error("Choose a valid cross-section side.");
      if (width) {
        cs.bottomWidth = entry.bottomWidth;
        cs.widthOffset = custom ? number(entry.widthOffset, "width offset") : 0;
        cs.widthSide = side;
      } else {
        const ratio = entry.horizontal != null && entry.vertical != null ? String(entry.horizontal) + ":" + String(entry.vertical) : null;
        if (ratio && side !== "rhs") cs.lhs = ratio;
        if (ratio && side !== "lhs") cs.rhs = ratio;
        cs.berm = entry.berm;
      }
    }
    return matched ? cs : null;
  };
  const shapeSection = (row, target) => {
    const cs = sectionSettings(row);
    if (cs) return csSection(sourceRows.get(row.chainage), row, center, target, cs, channelShape, superElevation);
    const amount = target - interpolateGround(groundProfile(row), center);
    return { ...row, reducedLevels: row.reducedLevels.map(value => Number(value) + amount) };
  };
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
    if (h <= 0 || v < 0) throw Error("CS slope must have positive horizontal run and non-negative rise, starting at V:H = 0:1.");
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
    if (settings.waterWorkspace && csGeometry && !settings.cs.fixedBottomEnabled && !slopeEnabled) {
      const cs = sectionSettings(row);
      if (cs) {
        const bounds = csElevationBounds(sourceRows.get(row.chainage), center, cs, waterTemplate);
        target = Math.min(bounds.max, Math.max(bounds.min, target));
      }
    }
    row.reducedLevels = row.reducedLevels.map((value, index) => {
      const offset = Number(row.intermediateOffsets[index].offset) - center;
      let next = Number(value) + target - oldCenter;
      if (crossGrade !== null) {
        const bedWidth = settings.template === "water" ? number(settings.cs.bedWidth, "flat bed width") : 0;
        if (bedWidth < 0) throw Error("Flat bed width must not be negative.");
        next = target + (settings.template === "water" ? 1 : -1) * Math.max(0, Math.abs(offset) - bedWidth / 2) * crossGrade;
      }
      return next + offset * superElevation - Math.abs(offset) * camber;
    });
  });
  // The reference LS elevation may sit above a bank (or below the feasible
  // slope toes). Find the allowed shift before constructing CS geometry.
  const shift = (amount) => roundProposalLevels({ ...draft, rows: draft.rows.map((row) => row.type !== "Chainage" ? row : csGeometry ? shapeSection(row, interpolateGround(groundProfile(row), center) + amount) : { ...row, reducedLevels: row.reducedLevels.map((value) => Number(value) + amount) }) });
  const conditionQuantity = settings.mode !== "manual" && !slopeEnabled && settings.ls?.quantityType
    && (settings.waterWorkspace || settings.ls.quantityType !== (survey.type === "Water Way" ? "cutting" : "filling"));
  const strategy = conditionQuantity ? "quantity" : settings.ls?.strategy;
  if (conditionQuantity || (slopeEnabled && !customSlope && strategy !== "anchor")) {
    const groundLevels = base.rows.filter((row) => row.type === "Chainage").flatMap((row) => row.reducedLevels.map(Number));
    const designLevels = rows.flatMap((row) => row.reducedLevels);
    let low = Math.min(...groundLevels) - Math.max(...designLevels) - 100;
    let high = Math.max(...groundLevels) - Math.min(...designLevels) + 100;
    if (csGeometry && !settings.cs.fixedBottomEnabled) {
      for (const row of rows) {
        const cs = sectionSettings(row);
        if (!cs) continue;
        const bounds = csElevationBounds(sourceRows.get(row.chainage), center, cs, waterTemplate);
        const current = interpolateGround(groundProfile(row), center);
        low = Math.max(low, bounds.min-current); high = Math.min(high, bounds.max-current);
      }
      if (low > high) throw Error("No profile elevation fits the selected LS grade, side slopes and berm. Adjust the LS grade or cross-section settings.");
    }
    // Search integer 5 mm start levels. Searching fractional shifts can land
    // on a rounding boundary and give equal gradients inconsistent endpoints.
    const profileStart = interpolateGround(groundProfile(rows[0]), center);
    low = Math.ceil((profileStart + low - 1e-10) * 200);
    high = Math.floor((profileStart + high + 1e-10) * 200);
    if (low > high) throw Error("No profile elevation in 0.005 m increments fits the selected design.");
    const atStep = step => shift(step / 200 - profileStart);
    const quantity = strategy === "minimum" ? 0 : number(settings.targetQuantity ?? seed.quantity, "target quantity");
    if (strategy === "quantity" && quantity < 0) throw Error("Target quantity must not be negative.");
    if (strategy === "quantity") {
      const key = settings.ls.quantityType === "cutting" ? "cutting" : "filling";
      const endQuantities = [proposalDesignQuantity(survey, base, atStep(low), breaks)[key], proposalDesignQuantity(survey, base, atStep(high), breaks)[key]];
      if (quantity > Math.max(...endQuantities) + 0.0001 || quantity < Math.min(...endQuantities) - 0.0001) throw Error("Target quantity cannot be reached within the available sections and proposal breaks.");
    }
    for (let iteration = 0; iteration < 65; iteration++) {
      if (strategy === "minimum") {
        if (high - low <= 6) break;
        const a = Math.floor(low + (high - low) / 3), b = Math.ceil(high - (high - low) / 3);
        const qa = proposalDesignQuantity(survey, base, atStep(a), breaks), qb = proposalDesignQuantity(survey, base, atStep(b), breaks);
        if (qa.cutting + qa.filling < qb.cutting + qb.filling) high = b; else low = a;
      } else {
        if (high - low <= 1) break;
        const mid = Math.floor((low + high) / 2);
        const q = proposalDesignQuantity(survey, base, atStep(mid), breaks);
        const cutting = settings.ls.quantityType === "cutting";
        if (cutting ? q.cutting > quantity : q.filling < quantity) low = mid; else high = mid;
      }
    }
    const score = candidate => {
      const totals = proposalDesignQuantity(survey, base, candidate, breaks);
      return strategy === "minimum" ? totals.cutting + totals.filling
        : Math.abs(totals[settings.ls.quantityType === "cutting" ? "cutting" : "filling"] - quantity);
    };
    let solved = atStep(low), bestScore = score(solved);
    // Check both neighbouring grid levels when the exact target is between them.
    for (let step = low + 1; step <= high; step++) {
      const candidate = atStep(step), candidateScore = score(candidate);
      if (candidateScore < bestScore) { solved = candidate; bestScore = candidateScore; }
    }
    draft.rows = solved.rows;
  } else if (csGeometry) {
    rows.forEach(row => Object.assign(row, shapeSection(row, interpolateGround(groundProfile(row), center))));
  }
  draft.designSettings = { ...settings, breaks, version: 1 };
  // Snap all remaining design modes before preview/save/report.
  return roundProposalLevels(draft);
};
