export const purposeLevels = [
  "Initial Level",
  "Final Level",
  "Final Earth Work",
  "Final Quarry Muck",
  "Final GSB",
  "Final WMM",
  "Final BM",
  "Final BC",
  "Final Tile Top",
];

export const purposeCode = {
  "Initial Level": "IL",
  "Final Level": "FL",
  "Final Earth Work": "FEW",
  "Final Quarry Muck": "QM",
  "Final GSB": "FGSB",
  "Final WMM": "FWMM",
  "Final BM": "FBM",
  "Final BC": "FBC",
  "Final Tile Top": "FTT",
};

export const proposalLevels = [
  "Proposed Level",
  "Proposed Earth Work",
  "Proposed Muck",
  "Proposed GSB",
  "Proposed WMM",
  "Proposed BM",
  "Proposed BC",
  "Proposed Tile Top",
];

export const proposalCode = {
  "Proposed Level": "PL",
  "Proposed Earth Work": "PEW",
  "Proposed Quarry Muck": "PQM",
  "Proposed GSB": "PGSB",
  "Proposed WMM": "PWMM",
  "Proposed BM": "PBM",
  "Proposed BC": "PBC",
  "Proposed Tile Top": "PTT",
};

export const v1ChartOptions = {
  id: "v1",
  config: {
    displayModeBar: true,
    scrollZoom: false,
    doubleClick: false,
    displaylogo: false,
  },
  layout: {
    title: "CS",
    dragmode: false,
    showlegend: false,

    margin: { l: 50, r: 20, t: 30, b: 20 },
    transition: {
      duration: 500,
      easing: "cubic-in-out",
    },
  },
  style: { width: "100%", height: "250px" },
};

export const v2ChartOptions = {
  id: "v2",
  config: {
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false,
    displaylogo: false,
  },
  layout: {
    title: "LS",
    dragmode: false,
    showlegend: false,

    margin: { l: 10, r: 10, t: 30, b: 20 },

    xaxis: {
      showgrid: false,
      zeroline: false,
      showline: false,
      showticklabels: false,
      ticks: "",
    },

    yaxis: {
      showgrid: false,
      zeroline: false,
      showline: false,
      showticklabels: false,
      ticks: "",
    },

    transition: {
      duration: 500,
      easing: "cubic-in-out",
    },
  },
  style: { width: "100%", height: "100px" },
};

export const getAllRlAndHi = (purpose) => {
  if (!purpose) return [];

  const survey = purpose.surveyId || {};
  let hi = 0;
  let rl = 0;

  return purpose.rows.map((row) => {
    const reducedLevels = [];

    switch (row.type) {
      case "Instrument setup": {
        rl = Number(survey.reducedLevel || 0);
        hi = rl + Number(row.backSight || 0);

        reducedLevels.push(rl.toFixed(3));
        break;
      }

      case "Chainage":
      case "TBM": {
        const inter = row.intermediateSight || [];
        for (let i = 0; i < inter.length; i++) {
          const isVal = inter[i];
          const rlValue = (hi - Number(isVal || 0)).toFixed(3);

          reducedLevels.push(rlValue);
        }
        break;
      }

      case "CP": {
        rl = Number(hi) - Number(row.foreSight || 0);
        hi = rl + Number(row.backSight || 0);

        reducedLevels.push(rl.toFixed(3));

        break;
      }

      default:
        break;
    }

    return {
      ...row,
      reducedLevels,
      heightOfInstrument: hi,
    };
  });
};

export const getLastRlAndHi = (survey, newReading, purposeId) => {
  const purpose = survey.purposes?.find(
    (p) => String(p._id) === String(purposeId)
  );

  if (!purpose) return { hi: null, rl: [] };

  if (purpose.status === "Paused") {
    purpose.rows?.pop();
  }

  // STEP 1: Find last CP
  const lastCPIndex =
    [...purpose.rows]
      .map((r, i) => (r.type === "CP" ? i : -1))
      .filter((i) => i >= 0)
      .pop() ?? -1;

  // STEP 2: Start slice
  const startIndex = lastCPIndex === -1 ? 0 : lastCPIndex;
  const rowsToProcess = [...purpose.rows.slice(startIndex + 1), newReading]; // +1 is used to remove the CP itself

  let hi = null;
  let rl = null;
  let finalRLArray = [];

  // If no CP and slice starts from 0, ensure instrument setup starts RL
  if (startIndex === 0 && purpose.rows.length > 0) {
    const first = purpose.rows[0];
    if (first.type === "Instrument setup") {
      rl = Number(survey.reducedLevel || 0);
      hi = rl + Number(first.backSight || 0);
    }
  } else {
    rl = purpose.rows[startIndex].reducedLevels[0];
    hi = purpose.rows[startIndex].heightOfInstrument;
  }

  // STEP 3: Loop only CP→end or whole thing if no CP
  for (const row of rowsToProcess) {
    switch (row.type) {
      case "Instrument setup": // Does not need these
        rl = Number(survey.reducedLevel || 0);
        hi = rl + Number(row.backSight || 0);
        finalRLArray = [rl.toFixed(3)];
        break;

      case "Chainage":
      case "TBM":
        if (
          Array.isArray(row.intermediateSight) &&
          row.intermediateSight.length
        ) {
          const rls = row.intermediateSight.map((isVal) =>
            (Number(hi) - Number(isVal || 0)).toFixed(3)
          );

          rl = Number(rls[rls.length - 1]);
          finalRLArray = rls;
        }
        break;

      case "CP": // Does not need these
        rl = Number(hi) - Number(row.foreSight || 0);
        hi = rl + Number(row.backSight || 0);
        finalRLArray = [rl.toFixed(3)];
        break;

      default:
        break;
    }
  }

  // STEP 4: Return values FOR NEW READING ONLY
  return {
    hi: hi ? Number(hi).toFixed(3) : null,
    rl: finalRLArray,
  };
};

export const unitCategories = {
  // ---------------- Length ----------------
  length: {
    label: "Length",
    base: "m",
    units: {
      km: { label: "Kilometre", toBase: 1000 },
      m: { label: "Metre", toBase: 1 },
      cm: { label: "Centimetre", toBase: 0.01 },
      mm: { label: "Millimetre", toBase: 0.001 },
      um: { label: "Micrometre", toBase: 1e-6 },
      nm: { label: "Nanometre", toBase: 1e-9 },
      mile: { label: "Mile", toBase: 1609.344 },
      yard: { label: "Yard", toBase: 0.9144 },
      ft: { label: "Foot", toBase: 0.3048 },
      inch: { label: "Inch", toBase: 0.0254 },
      nMile: { label: "Nautical Mile", toBase: 1852 },
    },
  },

  // ---------------- Area ----------------
  area: {
    label: "Area",
    base: "m2",
    units: {
      km2: { label: "Square Kilometre", toBase: 1e6 },
      m2: { label: "Square Metre", toBase: 1 },
      cm2: { label: "Square Centimetre", toBase: 1e-4 },
      mm2: { label: "Square Millimetre", toBase: 1e-6 },
      acre: { label: "Acre", toBase: 4046.8564224 },
      hectare: { label: "Hectare", toBase: 10000 },
    },
  },

  // ---------------- Volume ----------------
  volume: {
    label: "Volume",
    base: "l",
    units: {
      kl: { label: "Kilolitre", toBase: 1000 },
      l: { label: "Litre", toBase: 1 },
      ml: { label: "Millilitre", toBase: 0.001 },
      m3: { label: "Cubic Metre", toBase: 1000 },
      gallon: { label: "Gallon (US)", toBase: 3.78541 },
      qt: { label: "Quart (US)", toBase: 0.946353 },
      pt: { label: "Pint (US)", toBase: 0.473176 },
      cup: { label: "Cup (US)", toBase: 0.24 },
      oz: { label: "Fluid Ounce (US)", toBase: 0.0295735 },
    },
  },

  // ---------------- Mass ----------------
  mass: {
    label: "Mass",
    base: "kg",
    units: {
      t: { label: "Tonne", toBase: 1000 },
      kg: { label: "Kilogram", toBase: 1 },
      g: { label: "Gram", toBase: 0.001 },
      mg: { label: "Milligram", toBase: 1e-6 },
      lb: { label: "Pound", toBase: 0.453592 },
      oz: { label: "Ounce", toBase: 0.0283495 },
    },
  },

  // ---------------- Temperature ----------------
  temperature: {
    label: "Temperature",
    isSpecial: true,
    units: {
      c: { label: "Celsius" },
      f: { label: "Fahrenheit" },
      k: { label: "Kelvin" },
    },
  },

  // ---------------- Speed ----------------
  speed: {
    label: "Speed",
    base: "mps",
    units: {
      mps: { label: "Meter per second", toBase: 1 },
      kph: { label: "Kilometer per hour", toBase: 0.277778 },
      mph: { label: "Miles per hour", toBase: 0.44704 },
      knot: { label: "Knot", toBase: 0.514444 },
      fps: { label: "Foot per second", toBase: 0.3048 },
    },
  },

  // ---------------- Time ----------------
  time: {
    label: "Time",
    base: "s",
    units: {
      day: { label: "Day", toBase: 86400 },
      h: { label: "Hour", toBase: 3600 },
      min: { label: "Minute", toBase: 60 },
      s: { label: "Second", toBase: 1 },
      ms: { label: "Millisecond", toBase: 0.001 },
    },
  },

  // ---------------- Pressure ----------------
  pressure: {
    label: "Pressure",
    base: "pa",
    units: {
      pa: { label: "Pascal", toBase: 1 },
      kpa: { label: "Kilopascal", toBase: 1000 },
      bar: { label: "Bar", toBase: 100000 },
      psi: { label: "PSI", toBase: 6894.76 },
      atm: { label: "Atmosphere", toBase: 101325 },
      mmHg: { label: "Millimeter of Mercury", toBase: 133.322 },
    },
  },

  // ---------------- Frequency ----------------
  frequency: {
    label: "Frequency",
    base: "hz",
    units: {
      hz: { label: "Hertz", toBase: 1 },
      khz: { label: "Kilohertz", toBase: 1000 },
      mhz: { label: "Megahertz", toBase: 1e6 },
      ghz: { label: "Gigahertz", toBase: 1e9 },
    },
  },

  // ---------------- Energy ----------------
  energy: {
    label: "Energy",
    base: "j",
    units: {
      j: { label: "Joule", toBase: 1 },
      kj: { label: "Kilojoule", toBase: 1000 },
      cal: { label: "Calorie", toBase: 4.184 },
      kcal: { label: "Kilocalorie", toBase: 4184 },
      wh: { label: "Watt Hour", toBase: 3600 },
      kwh: { label: "Kilowatt Hour", toBase: 3.6e6 },
    },
  },

  // ---------------- Digital Storage ----------------
  digital: {
    label: "Digital Storage",
    base: "byte",
    units: {
      bit: { label: "Bit", toBase: 1 / 8 },
      byte: { label: "Byte", toBase: 1 },
      kb: { label: "Kilobyte", toBase: 1024 },
      mb: { label: "Megabyte", toBase: 1024 ** 2 },
      gb: { label: "Gigabyte", toBase: 1024 ** 3 },
      tb: { label: "Terabyte", toBase: 1024 ** 4 },
      pb: { label: "Petabyte", toBase: 1024 ** 5 },
    },
  },

  // ---------------- Data Transfer Rate ----------------
  dataRate: {
    label: "Data Transfer Rate",
    base: "bps",
    units: {
      bps: { label: "Bit per second", toBase: 1 },
      kbps: { label: "Kilobits per second", toBase: 1000 },
      mbps: { label: "Megabits per second", toBase: 1e6 },
      gbps: { label: "Gigabits per second", toBase: 1e9 },
    },
  },

  // ---------------- Fuel Economy ----------------
  fuel: {
    label: "Fuel Economy",
    isSpecial: true,
    units: {
      kmpl: { label: "Kilometer per litre" },
      mpg: { label: "Miles per gallon" },
    },
  },

  // ---------------- Plane Angle ----------------
  angle: {
    label: "Plane Angle",
    base: "deg",
    units: {
      deg: { label: "Degree", toBase: 1 },
      rad: { label: "Radian", toBase: 57.2957795 },
      grad: { label: "Gradian", toBase: 0.9 },
    },
  },
};

export const convertValue = (category, from, to, value) => {
  value = parseFloat(value);
  if (isNaN(value)) return "";

  const config = unitCategories[category];

  // Special Cases
  if (category === "temperature") return convertTemperature(from, to, value);
  if (category === "fuel") return convertFuel(from, to, value);

  // Normal SI conversions
  const base = value * config.units[from].toBase;
  return base / config.units[to].toBase;
};

export const convertTemperature = (from, to, value) => {
  let c;

  // Convert from → Celsius
  if (from === "c") c = value;
  if (from === "f") c = ((value - 32) * 5) / 9;
  if (from === "k") c = value - 273.15;

  // Convert Celsius → target unit
  if (to === "c") return c;
  if (to === "f") return (c * 9) / 5 + 32;
  if (to === "k") return c + 273.15;
};

export const convertFuel = (from, to, value) => {
  if (from === "kmpl") {
    const mpg = value * 2.35215;
    return to === "kmpl" ? value : mpg;
  }

  if (from === "mpg") {
    const kmpl = value / 2.35215;
    return to === "kmpl" ? kmpl : value;
  }
};
