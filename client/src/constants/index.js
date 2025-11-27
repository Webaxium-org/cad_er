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

  colors: ['blue', 'green', 'red', '#9B59B6', '#F1C40F', '#34495E'],

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
    tickAmount: 10,
    labels: { show: false },
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

  legend: { show: true },
  tooltip: { enabled: true },
};

export const calculateReducedLevel = (survey) => {
  if (!survey?.purposes?.length) return survey;

  // Find the Initial Level purpose
  const initialSurvey = survey.purposes.find((p) => p.type === 'Initial Level');

  if (!initialSurvey || !initialSurvey.rows?.length) return survey;

  let hi = 0; // Height of Instrument
  let rl = Number(survey.reducedLevel || 0); // Starting Reduced Level
  const updatedRows = [];

  for (const row of initialSurvey.rows) {
    const updatedRow = { ...(row.toObject?.() ?? row) }; // Safe clone (works for Mongoose docs too)

    switch (row.type) {
      case 'Instrument setup':
        hi = rl + Number(row.backSight || 0);
        updatedRow.RL = Number(rl.toFixed(3));
        updatedRow.HI = Number(hi.toFixed(3));
        break;

      case 'Chainage':
        updatedRow.reducedLevels = (row.intermediateSight || []).map(
          (isVal) => {
            const calcRL = hi - Number(isVal || 0);
            rl = calcRL; // Update RL for next iteration
            return Number(calcRL.toFixed(3));
          }
        );
        updatedRow.RL = rl; // last RL after loop
        updatedRow.HI = Number(hi.toFixed(3));
        break;

      case 'TBM':
        updatedRow.reducedLevels = (row.intermediateSight || []).map(
          (isVal) => {
            const calcRL = hi - Number(isVal || 0);
            rl = calcRL;
            return Number(calcRL.toFixed(3));
          }
        );
        updatedRow.RL = rl;
        updatedRow.HI = Number(hi.toFixed(3));
        break;

      case 'CP':
        rl = hi - Number(row.foreSight || 0);
        hi = rl + Number(row.backSight || 0);
        updatedRow.RL = Number(rl.toFixed(3));
        updatedRow.HI = Number(hi.toFixed(3));
        break;

      default:
        updatedRow.RL = Number(rl.toFixed(3));
        updatedRow.HI = Number(hi.toFixed(3));
        break;
    }

    updatedRows.push(updatedRow);
  }

  // Replace the updated rows in the Initial Level purpose
  const updatedInitialSurvey = {
    ...initialSurvey,
    rows: updatedRows,
  };

  // Replace the modified purpose in the survey
  const updatedPurposes = survey.purposes.map((p) =>
    p.type === 'Initial Level' ? updatedInitialSurvey : p
  );

  // Attach the final RL as the survey's reducedLevel
  return {
    ...survey,
    purposes: updatedPurposes,
    reducedLevel: Number(rl.toFixed(3)),
  };
};
