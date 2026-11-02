const numeric = (value) => value != null && String(value).trim() !== "" && Number.isFinite(Number(value));

export const parseChainage = (value, separator = "/") => {
  if (typeof value !== "string" || value.length > 60) throw Error("Enter a valid chainage.");
  const parts = value.trim().split(separator);
  if (parts.length > 2 || parts.some((part) => !/^\d+(?:\.\d{1,3})?$/.test(part))) {
    throw Error("Enter a non-negative chainage with up to three decimal places.");
  }
  if (parts.length === 2 && (!/^\d+$/.test(parts[0]) || Number(parts[1]) >= 1000)) {
    throw Error("Use kilometres and metres below 1000, for example 0/025.");
  }
  const metres = parts.length === 2 ? Number(parts[0]) * 1000 + Number(parts[1]) : Number(parts[0]);
  if (!Number.isSafeInteger(Math.round(metres * 1000))) throw Error("Chainage is too large.");
  return metres;
};

const canonicalChainage = (metres, separator) => {
  const millimetres = Math.round(metres * 1000);
  const km = Math.floor(millimetres / 1000000);
  const remainder = ((millimetres % 1000000) / 1000).toFixed(3).replace(/\.?0+$/, "");
  const [whole, decimal] = (remainder || "0").split(".");
  return `${km}${separator}${whole.padStart(3, "0")}${decimal ? `.${decimal}` : ""}`;
};

const sample = (offsets, levels, x) => {
  const index = offsets.findIndex((offset) => offset >= x);
  if (index < 0 || (index === 0 && offsets[0] !== x)) throw Error("The LS offset is outside the cross-section.");
  if (offsets[index] === x) return levels[index];
  const ratio = (x - offsets[index - 1]) / (offsets[index] - offsets[index - 1]);
  return levels[index - 1] + ratio * (levels[index] - levels[index - 1]);
};

// Build complete cross-sections, not isolated LS points. No extrapolation or interpolation across breaks.
export const buildChainagePlan = ({ survey, purposes, chainage, referencePurposeId }) => {
  const separator = survey.separator || "/";
  const target = parseChainage(chainage, separator);
  if (!purposes.length) throw Error("This survey has no levels to insert into.");
  const reference = purposes.find((purpose) => String(purpose._id) === String(referencePurposeId));
  if (!reference) throw Error("Choose a level from this survey as the LS reference.");
  const pls = reference.pls == null || reference.pls === "" ? 0 : Number(reference.pls);
  if (!Number.isFinite(pls)) throw Error("The LS reference offset is invalid.");
  let commonOffsets;
  const entries = purposes.map((purpose) => {
    const rows = purpose.rows || [];
    const stations = rows.filter((row) => row.type === "Chainage" && !row.deleted)
      .map((row) => ({ row, distance: parseChainage(row.chainage, separator) }));
    if (stations.some(({ distance }) => Math.abs(distance - target) < 0.0005)) {
      throw Error(`Chainage already exists in ${purpose.type}.`);
    }
    const sorted = [...stations].sort((a, b) => a.distance - b.distance);
    const rightIndex = sorted.findIndex(({ distance }) => distance > target);
    if (rightIndex < 1) throw Error(`Choose a chainage between existing stations in ${purpose.type}.`);
    const left = sorted[rightIndex - 1], right = sorted[rightIndex];
    const leftIndex = rows.indexOf(left.row), insertionIndex = rows.indexOf(right.row);
    if (leftIndex >= insertionIndex || rows.slice(leftIndex + 1, insertionIndex).some((row) => row.type === "Break" && !row.deleted)) {
      throw Error(`Cannot insert across a break or reversed readings in ${purpose.type}.`);
    }
    const readProfile = (row) => {
      const offsets = (row.intermediateOffsets || []).map((entry) => entry.offset);
      const levels = row.reducedLevels || [];
      if (offsets.length < 2 || offsets.length !== levels.length || [...offsets, ...levels].some((value) => !numeric(value))) {
        throw Error(`Complete cross-section data is required in ${purpose.type}.`);
      }
      const xs = offsets.map(Number);
      if (xs.some((x, index) => index > 0 && x <= xs[index - 1])) throw Error(`Offsets must increase in ${purpose.type}.`);
      return { offsets: xs, levels: levels.map(Number) };
    };
    const a = readProfile(left.row), b = readProfile(right.row);
    commonOffsets ??= a.offsets;
    if ([a.offsets, b.offsets].some((offsets) => offsets.length !== commonOffsets.length
      || offsets.some((offset, index) => offset !== commonOffsets[index]))) {
      throw Error("Neighbouring cross-sections must use matching offsets in every level. Use the field book for sections with different widths or offsets.");
    }
    const ratio = (target - left.distance) / (right.distance - left.distance);
    const levels = a.levels.map((level, index) => level + (b.levels[index] - level) * ratio);
    // Insert immediately before the next station, after any CP or water-level reading.
    let hi = null;
    for (const row of rows.slice(0, insertionIndex)) {
      if (row.deleted) continue;
      if (row.type === "Instrument setup") {
        if (!numeric(row.reducedLevels?.[0]) || !numeric(row.backSight)) throw Error(`Instrument readings are incomplete in ${purpose.type}.`);
        hi = Number(row.reducedLevels[0]) + Number(row.backSight);
      } else if (row.type === "CP") {
        if (!numeric(row.heightOfInstrument)) throw Error(`Instrument readings are incomplete in ${purpose.type}.`);
        hi = Number(row.heightOfInstrument);
      }
    }
    if (!Number.isFinite(hi) && purpose.phase === "Proposal") {
      hi = numeric(right.row.heightOfInstrument) ? Number(right.row.heightOfInstrument) : 0;
    }
    if (!Number.isFinite(hi)) throw Error(`An instrument setup is required in ${purpose.type}.`);
    return {
      purposeId: String(purpose._id), name: purpose.type,
      from: left.row.chainage, to: right.row.chainage,
      rl: Number(sample(commonOffsets, levels, pls).toFixed(3)),
      offsets: commonOffsets, levels, hi, insertionIndex,
      roadWidth: numeric(left.row.roadWidth) && numeric(right.row.roadWidth)
        ? (Number(left.row.roadWidth) + (Number(right.row.roadWidth) - Number(left.row.roadWidth)) * ratio).toFixed(3) : undefined,
      spacing: left.row.spacing, basis: "Readings",
    };
  });
  return { chainage: canonicalChainage(target, separator), entries };
};

export const applyChainageLevels = (plan, levels) => {
  if (!Array.isArray(levels) || levels.length !== plan.entries.length
    || new Set(levels.map((entry) => entry?.purposeId)).size !== levels.length) throw Error("Provide an RL for every level.");
  return plan.entries.map((entry) => {
    const value = levels.find((level) => level?.purposeId === entry.purposeId)?.rl;
    if (!numeric(value) || Math.abs(Number(value)) > 1000000) throw Error(`Enter a valid RL for ${entry.name}.`);
    const delta = Number(value) - entry.rl;
    const reducedLevels = entry.levels.map((rl) => (rl + delta).toFixed(3));
    return {
      purposeId: entry.purposeId, type: "Chainage", chainage: plan.chainage,
      roadWidth: entry.roadWidth, spacing: entry.spacing, basis: entry.basis,
      heightOfInstrument: entry.hi.toFixed(3), reducedLevels,
      intermediateOffsets: entry.offsets.map((offset, index) => ({
        offset: offset.toFixed(3), is: (entry.hi - Number(reducedLevels[index])).toFixed(3), mode: "R",
        remark: "Interpolated chainage added from LS Profile",
      })),
      observation: `Interpolated between ${entry.from} and ${entry.to} from LS Profile.`,
    };
  });
};
