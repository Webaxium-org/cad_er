export const purposeLevels = [
  'Initial Level',
  'Final Level',
  'Final Earth Work',
  'Quarry Muck',
  'Final GSB',
  'Final WMM',
  'Final BM',
  'Final BC',
  'Final Tile Top',
];

export const purposeCode = {
  'Initial Level': 'IL',
  'Final Level': 'FL',
  'Final Earth Work': 'FEW',
  'Quarry Muck': 'QM',
  'Final GSB': 'FGSB',
  'Final WMM': 'FWMM',
  'Final BM': 'FBM',
  'Final BC': 'FBC',
  'Final Tile Top': 'FTT',
};

export const proposalLevels = [
  'Proposed Level',
  'Proposed Earth Work',
  'Proposed Muck',
  'Proposed GSB',
  'Proposed WMM',
  'Proposed BM',
  'Proposed BC',
  'Proposed Tile Top',
];

export const proposalCode = {
  'Proposed Level': 'PL',
  'Proposed Earth Work': 'PEW',
  'Proposed Quarry Muck': 'PQM',
  'Proposed GSB': 'PGSB',
  'Proposed WMM': 'PWMM',
  'Proposed BM': 'PBM',
  'Proposed BC': 'PBC',
  'Proposed Tile Top': 'PTT',
};

export const initialChartOptions = {
  chart: {
    id: 'cross-section',
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  stroke: {
    curve: 'straight',
    width: 1,
  },
  colors: ['blue', 'green', 'red', '#9B59B6', '#F1C40F', '#34495E'],
  grid: {
    show: false,
  },
  xaxis: {
    type: 'numeric',
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: false },
  },
  yaxis: {
    min: 0,
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: false },
  },
  legend: { show: false },
  tooltip: { enabled: false },
};

export const advancedChartOptions = {
  chart: {
    id: 'cross-section-v2',
    toolbar: { show: false },
    zoom: { enabled: false },
  },

  stroke: {
    curve: 'straight',
    width: 1,
  },

  grid: {
    show: true,
    borderColor: '#ccc',
    strokeDashArray: 0,
    xaxis: {
      lines: { show: true },
    },
    yaxis: {
      lines: { show: true },
    },
  },

  xaxis: {
    type: 'numeric',
    tickAmount: 'dataPoints',
    labels: { show: true },
    axisBorder: {
      show: true,
      color: '#222222',
    },
    axisTicks: {
      show: true,
      color: '#222222',
    },
  },

  yaxis: {
    tickAmount: 10,
    min: 0,
    labels: { show: true },
    axisBorder: {
      show: true,
      color: '#222222',
    },
    axisTicks: {
      show: true,
      color: '#222222',
    },
  },

  legend: { show: false },
  tooltip: { enabled: true },
};

export const calculateReducedLevel = (survey, newReading, purposeId) => {
  const purpose = survey.purposes?.find(
    (p) => String(p._id) === String(purposeId)
  );

  if (!purpose) return { hi: null, rl: [] };

  if (purpose.status === 'Paused') {
    purpose.rows?.pop();
  }

  // STEP 1: Find last CP
  const lastCPIndex =
    [...purpose.rows]
      .map((r, i) => (r.type === 'CP' ? i : -1))
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
    if (first.type === 'Instrument setup') {
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
      case 'Instrument setup': // Does not need these
        rl = Number(survey.reducedLevel || 0);
        hi = rl + Number(row.backSight || 0);
        finalRLArray = [rl.toFixed(3)];
        break;

      case 'Chainage':
      case 'TBM':
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

      case 'CP': // Does not need these
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
