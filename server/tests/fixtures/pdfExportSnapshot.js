export const pdfExportSnapshot = () => {
  const series = [
    { name: "Initial Level", color: "green", data: [{ x: 0, y: 10 }, { x: 10, y: 10.2 }, { x: 20, y: 10.1 }] },
    { name: "Proposed Level", color: "blue", data: [{ x: 0, y: 10.5 }, { x: 10, y: 10.5 }, { x: 20, y: 10.5 }] },
  ];
  return {
    surveyInfo: { project: "Background PDF regression", agreementNo: "TEST", name: "Test survey" },
    reportDetails: { initialEntry: "Initial Level", secondaryEntry: "Proposed Level" },
    tableData: { rows: [], areaReport: [], totalCuttingVolume: 0, totalFillingVolume: 32 },
    showArea: { cutting: false, filling: true }, chartWidth: 760,
    chartOptions: { style: { height: 300 }, layout: { autosize: true, height: 300, margin: { l: 60, r: 25, t: 20, b: 40 }, xaxis: { range: [0, 20] }, yaxis: { range: [9, 11] }, font: { size: 12 } }, config: { displayModeBar: false, responsive: true } },
    lsPages: [{ start: 0, end: 20, range: [0, 20], section: { type: "ls", datum: 9, chainages: [0, 10, 20], allRl: [10, 10.2, 10.1, 10.5], series } }],
    allCs: [{ type: "cs", chainage: "0/000", datum: 9, offsets: [-4, 0, 4], allRl: [10, 10.2, 10.1, 10.5], series: series.map((entry) => ({ ...entry, data: entry.data.map((point, index) => ({ ...point, x: [-4, 0, 4][index] })) })),
      specificOptions: { layout: { autosize: true, margin: { l: 60, r: 25, t: 20, b: 40 }, xaxis: { range: [-4, 4] }, yaxis: { range: [9, 11] }, font: { size: 12 } }, config: { displayModeBar: false, responsive: true } } }],
  };
};
