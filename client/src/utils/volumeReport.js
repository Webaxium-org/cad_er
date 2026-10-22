import { compareProfiles, chainageValue } from "./surveyGeometry.js";

// Shared by the volume report and the live longitudinal-section preview.
export const calculateVolumeReport = (survey, initialEntry, secondaryEntry, deductions = []) => {
  if (!survey || !initialEntry || !secondaryEntry) return { rows: [], missingSections: [], totalCuttingVolume: 0, totalFillingVolume: 0 };
  let isBreak = false;
  let breakMessage = "";
  const isDeduction = deductions.length;
  const initialRows = initialEntry?.rows ?? [];
  const secondaryRows = secondaryEntry?.rows ?? [];
  const isBottomWidthFixed =
    secondaryEntry?.proposalMethod === "Bottom Width Fixed";
  const fixedBottomWidth = Number(
    secondaryEntry?.bottomWidth ?? secondaryEntry?.width,
  );
  const missingSections = [];
  const useChannelGeometry = survey.type === "Water Way" && !isBottomWidthFixed;
  const rows = [];

  let prevSection = null;
  let currentDeduction = null;
  let isDeductionStarted = false;
  let isDeductionRemarkAdded = false;
  let cuttingPrevArea = "0.000";
  let fillingPrevArea = "0.000";

  const totals = {
    totalCuttingVolume: 0,
    totalFillingVolume: 0,
  };

  // Process only Chainage section rows. Water Level is a point reading, not a CS row.
  const filteredInitialRows = initialRows.filter(
    (row) => row.type === "Chainage" || row.type === "Break",
  );

  filteredInitialRows.forEach((row) => {
    if (row.type === "Break") {
      isBreak = true;
      breakMessage = row.remarks[0];
      prevSection = null;
      return;
    }

    const secondaryRow = secondaryRows?.find(
      (p) => p.chainage === row.chainage,
    );

    const chainage = useChannelGeometry ? chainageValue(row.chainage, survey?.separator || "/") : row.chainage?.split(survey?.separator || "/")?.[1] ?? "";

    let prevReadings = [];

    const data = useChannelGeometry ? compareProfiles(row, secondaryRow) : (secondaryRow?.offsets ?? []).map((entry, idx) => {
      const initialEntryRL = row?.reducedLevels?.[idx] ?? 0;
      const secondaryEntryRL = secondaryRow?.reducedLevels?.[idx] ?? 0;

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

      const dataDoc = {
        offset: entry,
        initialEntryRL,
        secondaryEntryRL,
        cuttingMtr,
        cuttingAvgMtr,
        cuttingWMtr: widthMtr,
        cuttingAreaSqMtr: (Number(cuttingAvgMtr) * Number(widthMtr)).toFixed(
          3,
        ),
        fillingMtr,
        fillingAvgMtr,
        fillingWMtr: widthMtr,
        fillingAreaSqMtr: (Number(fillingAvgMtr) * Number(widthMtr)).toFixed(
          3,
        ),
      };

      prevReadings.push(dataDoc);
      return dataDoc;
    });

    if (useChannelGeometry && !data.length) {
      missingSections.push(row.chainage);
      prevSection = null;
      cuttingPrevArea = "0.000";
      fillingPrevArea = "0.000";
      return;
    }

    // --- Total area for this section ---
    let cuttingAreaSqMtr = data.reduce(
      (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
      0,
    );
    let fillingAreaSqMtr = data.reduce(
      (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
      0,
    );

    if (isBottomWidthFixed && Number.isFinite(fixedBottomWidth)) {
      const centerOffset = Number(
        secondaryEntry?.pls ?? initialEntry?.pls ?? 0,
      );
      const initialOffsets = row?.offsets ?? [];
      const centerIndex = initialOffsets.reduce(
        (closestIndex, offset, index) =>
          Math.abs(Number(offset) - centerOffset) <
          Math.abs(Number(initialOffsets[closestIndex] ?? 0) - centerOffset)
            ? index
            : closestIndex,
        0,
      );
      const centerInitialRL = Number(row?.reducedLevels?.[centerIndex]);
      const proposalLevels = (secondaryRow?.reducedLevels ?? [])
        .map(Number)
        .filter(Number.isFinite);
      const bedRL = proposalLevels.length
        ? Math.min(...proposalLevels)
        : Number.NaN;

      if (Number.isFinite(centerInitialRL) && Number.isFinite(bedRL)) {
        const levelDifference = centerInitialRL - bedRL;
        cuttingAreaSqMtr =
          Math.max(levelDifference, 0) * fixedBottomWidth;
        fillingAreaSqMtr =
          Math.max(-levelDifference, 0) * fixedBottomWidth;
      }
    }

    // --- Compute chainage difference ---
    const currentChainage = Number(chainage) || 0;
    const prevChainage = Number(prevSection) || 0;
    let difference = null;
    let deductionMessage = null;
    let flag = false;

    if (isDeduction) {
      const isDeductionRow = deductions.find((d) => d.from === row.chainage);

      if (isDeductionRow) {
        isDeductionStarted = true;
        currentDeduction = isDeductionRow;
        isDeductionRemarkAdded = false;

        difference = prevSection !== null
          ? (currentChainage - prevChainage).toFixed(3)
          : "0.000";
      } else if (isDeductionStarted) {
        if (!isDeductionRemarkAdded) {
          const trimmedRemark = currentDeduction?.remark?.trim();

          difference = "0.000";
          flag = true;

          deductionMessage =
            "Deduction - " +
            (trimmedRemark
              ? trimmedRemark
              : `from ${currentDeduction?.from} to ${currentDeduction?.to}`);

          isDeductionRemarkAdded = true;
          if (currentDeduction.to === row.chainage) {
            currentDeduction = null;
            isDeductionStarted = false;
          }
        } else {
          const isDeductionEndingNow = currentDeduction.to === row.chainage;

          if (isDeductionEndingNow) {
            currentDeduction = null;
            isDeductionStarted = false;
          }

          difference = prevSection !== null
            ? (currentChainage - prevChainage).toFixed(3)
            : "0.000";
        }
      } else {
        difference = prevSection !== null
          ? (currentChainage - prevChainage).toFixed(3)
          : "0.000";
      }
    } else {
      difference = isBreak
        ? "0.000"
        : prevSection !== null
          ? (currentChainage - prevChainage).toFixed(3)
          : "0.000";
    }

    // --- Average areas ---
    const cuttingAvgSqrMtr = (
      (Number(cuttingAreaSqMtr) + Number(cuttingPrevArea)) /
      2
    ).toFixed(3);
    const fillingAvgSqrMtr = (
      (Number(fillingAreaSqMtr) + Number(fillingPrevArea)) /
      2
    ).toFixed(3);

    // --- Volumes ---
    const cuttingVolumeCubicMtr = (
      Number(difference) * (useChannelGeometry ? (cuttingAreaSqMtr + Number(cuttingPrevArea)) / 2 : Number(cuttingAvgSqrMtr))
    ).toFixed(3);

    const fillingVolumeCubicMtr = (
      Number(difference) * (useChannelGeometry ? (fillingAreaSqMtr + Number(fillingPrevArea)) / 2 : Number(fillingAvgSqrMtr))
    ).toFixed(3);

    const initialRoadWidth =
      Math.abs(Number(row?.offsets[0])) +
      Number(row?.offsets[row?.offsets?.length - 1]);
    const reportWidth =
      isBottomWidthFixed && Number.isFinite(fixedBottomWidth)
        ? fixedBottomWidth
        : useChannelGeometry ? Number(data.at(-1).offset) - Number(data[0].offset) : initialRoadWidth;

    // --- Push row ---
    rows.push({
      section: currentChainage.toFixed(3),
      prevSection: prevSection !== null ? prevChainage.toFixed(3) : "-",
      difference,
      width: Number(reportWidth).toFixed(3),
      cuttingAreaSqMtr: cuttingAreaSqMtr.toFixed(3),
      data,
      cuttingPrevArea: Number(cuttingPrevArea).toFixed(3),
      cuttingAvgSqrMtr,
      cuttingVolumeCubicMtr,
      fillingAreaSqMtr: fillingAreaSqMtr.toFixed(3),
      fillingPrevArea: Number(fillingPrevArea).toFixed(3),
      fillingAvgSqrMtr,
      fillingVolumeCubicMtr,
      deductionMessage,
      isDeductionRow: flag,
      isBreak,
      message: breakMessage,
    });

    // if (!showArea.cutting && Number(totals.totalCuttingVolume) > 0) {
    //   setShowArea((prev) => ({ ...prev, cutting: true }));
    // }

    // if (!showArea.filling && Number(totals.totalFillingVolume) > 0) {
    //   setShowArea((prev) => ({ ...prev, filling: true }));
    // }

    // --- Prepare for next iteration ---
    cuttingPrevArea = useChannelGeometry ? cuttingAreaSqMtr : Number(cuttingAreaSqMtr)?.toFixed(3);
    fillingPrevArea = useChannelGeometry ? fillingAreaSqMtr : Number(fillingAreaSqMtr)?.toFixed(3);
    totals.totalCuttingVolume += Number(cuttingVolumeCubicMtr);
    totals.totalFillingVolume += Number(fillingVolumeCubicMtr);
    prevSection = chainage;
    isBreak = false;
    breakMessage = "";
  });

  return { ...totals, rows, missingSections };
};
