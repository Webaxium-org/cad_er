import { compareProfiles } from "./surveyGeometry.js";

// Shared by the standalone Area Report and the plotting report, including its PDF.
export const calculateAreaReport = (survey, initialEntry, secondaryEntry) => {
  if (!survey || !initialEntry || !secondaryEntry) return [];
  const initialRows = initialEntry?.rows ?? [];
  const proposedRows = secondaryEntry?.rows ?? [];
  const rows = [];

  // Process only Chainage section rows. Water Level is a point reading, not a CS row.
  initialRows
    .filter((row) => row.type === "Chainage" || row.type === "Break")
    .forEach((row) => {
      const proposedRow = proposedRows?.find(
        (p) => p.chainage === row.chainage,
      );

      const value = row.type === "Break" ? row?.from : row.chainage;

      const chainage = value?.split(survey?.separator || "/")?.[1] ?? "";

      let prevReadings = [];

      const data = survey.type === "Water Way" && secondaryEntry?.proposalMethod !== "Bottom Width Fixed"
        ? compareProfiles(row, proposedRow) : (proposedRow?.offsets ?? []).map((entry, idx) => {
        const initialEntryRL = row?.reducedLevels?.[idx] ?? 0;
        const secondaryEntryRL = proposedRow?.reducedLevels?.[idx] ?? 0;

        const initRL = Number(initialEntryRL);
        const propRL = Number(secondaryEntryRL);
        const offsetVal = Number(entry);
        const prevOffsetVal = Number(row?.offsets?.[idx - 1] ?? 0);

        // Determine whether it's cutting or filling
        const isCutting = initRL > propRL;

        // Shared width (W) for both cutting and filling
        const widthMtr =
          idx === 0 ? "0.000" : (offsetVal - prevOffsetVal).toFixed(3);

        const cuttingMtr = isCutting ? (initRL - propRL).toFixed(3) : "0.000";

        const cuttingAvgMtr =
          !isCutting || idx === 0
            ? "0.000"
            : (
              (Number(cuttingMtr) +
                Number(prevReadings[idx - 1]?.cuttingMtr || 0)) /
              2
            ).toFixed(3);

        const fillingMtr = isCutting ? "0.000" : (propRL - initRL).toFixed(3);

        const fillingAvgMtr =
          isCutting || idx === 0
            ? "0.000"
            : (
              (Number(fillingMtr) +
                Number(prevReadings[idx - 1]?.fillingMtr || 0)) /
              2
            ).toFixed(3);

        const cuttingAreaSqMtr = Number(cuttingAvgMtr) * Number(widthMtr);

        const fillingAreaSqMtr = Number(fillingAvgMtr) * Number(widthMtr);

        const dataDoc = {
          initRL,
          propRL,
          offset: entry,
          initialEntryRL,
          secondaryEntryRL,
          cuttingMtr,
          cuttingAvgMtr,
          cuttingWMtr: widthMtr,
          cuttingAreaSqMtr: cuttingAreaSqMtr.toFixed(3),
          fillingMtr,
          fillingAvgMtr,
          fillingWMtr: widthMtr,
          fillingAreaSqMtr: fillingAreaSqMtr.toFixed(3),
        };

        prevReadings.push(dataDoc);
        return dataDoc;
      });

      const totalCuttingAreaSqMtr = data.reduce(
        (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
        0,
      );
      const totalFillingAreaSqMtr = data.reduce(
        (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
        0,
      );

      rows.push({
        section: Number(chainage),
        type: row.type,
        ...(row.type === "Break" ? { message: row.remarks?.[0] || row.remark || "Break" } : {}),
        data,
        totalCuttingAreaSqMtr,
        totalFillingAreaSqMtr,
      });
    });

  return rows;
};
