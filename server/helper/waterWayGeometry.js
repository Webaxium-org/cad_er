// Bank-to-bank channel templates. Side slopes are horizontal run / vertical rise.
const finite = (value, label) => {
  if (value === null || value === undefined || String(value).trim() === "" || !Number.isFinite(Number(value))) {
    throw new Error(`${label} must be a finite number.`);
  }
  return Number(value);
};

export const sideSlope = (value) => {
  const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s*[:/∶]\s*(\d+(?:\.\d+)?|\.\d+)$/);
  if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) {
    throw new Error("Side slope must be a positive H:V ratio, e.g. 1:1.");
  }
  return Number(match[1]) / Number(match[2]);
};

export const chainageMetres = (value, separator = "/") => {
  const parts = String(value ?? "").split(separator);
  if (parts.length === 1) return finite(parts[0], "Chainage");
  if (parts.length !== 2) throw new Error("Invalid chainage.");
  return finite(parts[0], "Chainage kilometres") * 1000 + finite(parts[1], "Chainage metres");
};

export const groundProfile = (reading) => {
  const points = (reading.intermediateOffsets || []).map((entry, index) => ({
    x: finite(entry.offset, "Ground offset"),
    y: finite(reading.reducedLevels?.[index], "Ground RL"),
  })).sort((a, b) => a.x - b.x);
  if (points.length < 2) throw new Error("At least two ground points are required.");
  const unique = [];
  for (const point of points) {
    if (unique.at(-1)?.x === point.x) {
      if (unique.at(-1).y !== point.y) throw new Error("Duplicate ground offsets have different RLs; resolve the bank profile before generating.");
    } else unique.push(point);
  }
  if (unique.length < 2) throw new Error("At least two distinct ground offsets are required.");
  return unique;
};

export const interpolateGround = (points, x) => {
  if (x < points[0].x || x > points.at(-1).x) throw new Error(`Offset ${x} is outside the measured ground profile.`);
  const exact = points.find((point) => point.x === x);
  if (exact) return exact.y;
  const index = points.findIndex((point) => point.x > x);
  const left = points[index - 1], right = points[index];
  return left.y + (right.y - left.y) * (x - left.x) / (right.x - left.x);
};

export const channelSection = ({ points, bed, left, right, ratio, center }) => {
  if (!(left < center && center < right)) throw new Error("Bank offsets must lie on opposite sides of the PLS offset.");
  const leftRL = interpolateGround(points, left);
  const rightRL = interpolateGround(points, right);
  if (bed > Math.min(leftRL, rightRL)) {
    throw new Error("Bed RL is above a bank RL. This bank-to-bank cut template cannot design an embankment; revise the bed or bank limits.");
  }
  const leftToe = left + ratio * (leftRL - bed);
  const rightToe = right - ratio * (rightRL - bed);
  if (rightToe - leftToe < 0.000001) throw new Error("Side slopes meet or overlap; increase bank width, reduce depth, or revise the side slope.");
  if (center < leftToe - 1e-9 || center > rightToe + 1e-9) throw new Error("The flat bed does not include the PLS offset; revise the banks or side slope.");
  const geometry = [
    { x: left, y: leftRL }, { x: leftToe, y: bed },
    { x: center, y: bed }, { x: rightToe, y: bed }, { x: right, y: rightRL },
  ].filter((point, index, all) => index === 0 || Math.abs(point.x - all[index - 1].x) > 1e-9);
  return {
    geometry,
    bedLevel: bed,
    offsets: geometry.map(({ x }) => ({ offset: x.toFixed(6), is: "", remark: "", mode: "S" })),
    proposedLevels: geometry.map(({ y }) => y.toFixed(3)),
    initialLevels: geometry.map(({ x }) => interpolateGround(points, x).toFixed(3)),
    width: right - left,
  };
};

export const prepareWaterWaySections = ({ readings, config, centerOffset, separator }) => {
  if (!["With Respect to Berm", "Slope End-to-End Type"].includes(config.proposalMethod)) {
    throw new Error("Choose With Respect to Berm or Slope End-to-End Type.");
  }
  return prepareBermSections({ readings, config: {
    ...config,
    bermWidth: config.proposalMethod === "Slope End-to-End Type" ? 0 : config.bermWidth,
  }, centerOffset, separator });
};

// Integral of positive ground-minus-design depth, split at every profile vertex
// and cut/fill crossing. This reproduces sample.pdf's 11.128 m² cutting area.
export const excavationArea = (ground, design) => {
  const left = design[0].x, right = design.at(-1).x;
  const offsets = [...new Set([...ground, ...design].map((p) => p.x).filter((x) => x >= left && x <= right))].sort((a, b) => a - b);
  let area = 0;
  for (let i = 1; i < offsets.length; i++) {
    const a = offsets[i - 1], b = offsets[i];
    const da = interpolateGround(ground, a) - interpolateGround(design, a);
    const db = interpolateGround(ground, b) - interpolateGround(design, b);
    if (da >= 0 && db >= 0) area += (b - a) * (da + db) / 2;
    else if (da > 0) area += (b - a) * da * da / (2 * (da - db));
    else if (db > 0) area += (b - a) * db * db / (2 * (db - da));
  }
  return area;
};

export const prepareBermSections = ({ readings, config, centerOffset, separator }) => {
  const center = finite(centerOffset ?? 0, "PLS offset");
  const ratio = sideSlope(config.slope);
  const bermWidth = finite(config.bermWidth, "Total berm width");
  const quantity = finite(config.quantity, "Excavation quantity");
  if (bermWidth < 0) throw new Error("Total berm width must not be negative.");
  if (quantity <= 0) throw new Error("Excavation quantity must be greater than zero.");
  const sections = readings.map((reading) => {
    try {
      const points = groundProfile(reading);
      // sample.pdf uses the outermost measured offsets, inset by half the total berm.
      const left = points[0].x + bermWidth / 2, right = points.at(-1).x - bermWidth / 2;
      if (!(left < center && center < right)) throw new Error("The berm leaves no channel on both sides of PLS. Reduce the total berm width or correct the surveyed limits.");
      const leftRL = interpolateGround(points, left), rightRL = interpolateGround(points, right);
      return { reading, points, left, right, leftRL, rightRL, chainage: chainageMetres(reading.chainage, separator) };
    } catch (error) { throw new Error(`Chainage ${reading.chainage}: ${error.message}`); }
  }).sort((a, b) => a.chainage - b.chainage);
  if (sections.length < 2) throw new Error("At least two distinct chainages are required to solve bed RL from an excavation quantity (m³).");
  if (sections.some((s, i) => i && s.chainage === sections[i - 1].chainage)) throw new Error("Duplicate chainages must be resolved before solving berm quantity.");
  // Limit the search to beds whose slopes fit and whose bed includes PLS.
  let lower = Math.max(...sections.map((s) => Math.max(s.leftRL - (center - s.left) / ratio, s.rightRL - (s.right - center) / ratio)));
  let upper = Math.min(...sections.map((s) => Math.min(s.leftRL, s.rightRL)));
  lower += 0.000002 / ratio;
  if (lower > upper) throw new Error("No common bed RL fits all berm sections with this side slope. Review the section limits or revise the requested design.");
  const atLevel = (s, bed) => channelSection({ ...s, bed, ratio, center });
  const volume = (bed) => {
    const areas = sections.map((s) => excavationArea(s.points, atLevel(s, bed).geometry));
    return sections.slice(1).reduce((sum, s, i) => sum + (s.chainage - sections[i].chainage) * (areas[i] + areas[i + 1]) / 2, 0);
  };
  const minimumBed = lower, maximumBed = upper;
  const minimum = volume(upper), maximum = volume(lower);
  const tolerance = Math.max(0.0001, quantity * 1e-10);
  if (quantity < minimum - tolerance || quantity > maximum + tolerance) {
    throw new Error(`Requested excavation quantity cannot fit these berm limits and side slope. Feasible quantity is ${minimum.toFixed(3)} to ${maximum.toFixed(3)} m³ for a common bed RL.`);
  }
  let bed = upper;
  for (let i = 0; i < 100; i++) {
    bed = (lower + upper) / 2;
    const value = volume(bed);
    if (Math.abs(value - quantity) <= tolerance) break;
    if (value > quantity) lower = bed; else upper = bed;
  }
  // Use the nearest feasible 5 mm level, then rebuild geometry from that level.
  const lowestStep = Math.ceil((minimumBed - 1e-10) * 200);
  const highestStep = Math.floor((maximumBed + 1e-10) * 200);
  if (lowestStep > highestStep) throw new Error("No bed RL in 0.005 m increments fits these sections. Review the berm limits or side slope.");
  const storedBed = Math.min(highestStep, Math.max(lowestStep, Math.round(bed * 200))) / 200;
  return new Map(sections.map((s) => {
    try { return [String(s.reading._id), atLevel(s, storedBed)]; }
    catch (error) { throw new Error(`Chainage ${s.reading.chainage}: Rounded bed RL ${storedBed.toFixed(3)} cannot fit this geometry. ${error.message}`); }
  }));
};
