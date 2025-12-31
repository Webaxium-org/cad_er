import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { getSurvey } from "../../services/surveyServices";
import { Box, Stack, Typography } from "@mui/material";
import CrossSectionChart from "./components/CrossSectionChart";
import { v1ChartOptions, v2ChartOptions } from "../../constants";
import BasicMenu from "../../components/BasicMenu";
import { BsThreeDots } from "react-icons/bs";
import { MdDownload } from "react-icons/md";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const LEVEL_ORDER = [
  "Initial Level",
  "Proposed Level",
  "Final Earth Work",
  "Proposed Earth Work",
  "Final Quarry Muck",
  "Proposed Quarry Muck",
  "Final GSB",
  "Proposed GSB",
  "Final WMM",
  "Proposed WMM",
  "Final BM",
  "Proposed BM",
  "Final BC",
  "Proposed BC",
  "Final Tile Top",
  "Proposed Tile Top",
  "Final Level",
];

const menuItems = [
  // { label: "v1", value: "v1" },
  // { label: "v2", value: "v2" },
  {
    label: (
      <Stack direction={"row"} alignItems={"center"} gap={0.5}>
        PDF
        <MdDownload />
      </Stack>
    ),
    value: "download",
  },
];

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const LongitudinalSectionReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const dispatch = useDispatch();

  const { state } = useLocation();

  const { global } = useSelector((state) => state.loading);

  const pdfRef = useRef();

  const [chartOptions, setChartOptions] = useState(v1ChartOptions);

  const [survey, setSurvey] = useState(null);

  const [tableData, setTableData] = useState([]);

  const [selectedCs, setSelectedCs] = useState(null);

  const downloadPDF = async () => {
    if (!pdfRef.current) return;

    await new Promise((res) => setTimeout(res, 300));

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a5");

    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;

    let imgWidth, imgHeight;

    if (imgRatio > pageRatio) {
      imgWidth = pageWidth;
      imgHeight = imgWidth / imgRatio;
    } else {
      imgHeight = pageHeight;
      imgWidth = imgHeight * imgRatio;
    }

    const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("cross-section.pdf");
  };

  const handleMenuSelect = (item) => {
    if (item.value === "download") return downloadPDF();

    if (!selectedCs) return;

    // Compute bounds
    const minY = Math.min(...selectedCs.allRl);
    const maxY = Math.max(...selectedCs.allRl);

    // Padding - you can tweak the factor
    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...selectedCs.chainages);
    const maxX = Math.max(...selectedCs.chainages);

    const xaxis = {
      autorange: false,
      range: [minX, maxX], // No padding, start exactly at the first x
      tickformat: ".3f", // 3 decimals always
      dtick: (maxX - minX) / 4, // Generates: min → -2 → 0 → 2 → max
      zeroline: false,
      showline: false,
      mirror: true,
    };

    if (item.value === "v1") {
      setChartOptions((_) => ({
        ...v1ChartOptions,
        layout: {
          ...v1ChartOptions.layout,
          yaxis: {
            zeroline: false,
            autorange: false,
            range: [minY - 2, maxY + pad],
          },

          xaxis,
        },
      }));
    }
    if (item.value === "v2") {
      setChartOptions((_) => ({
        ...v2ChartOptions,
        layout: {
          ...v2ChartOptions.layout,
          yaxis: {
            ...v2ChartOptions.layout.yaxis,
            zeroline: false,
            autorange: false,
            range: [minY - 2, maxY + pad],
          },

          xaxis: {
            ...v2ChartOptions.layout.xaxis,
            ...xaxis,
          },
        },
      }));
    }
  };

  const handleSetTableData = (survey) => {
    let data = [];

    if (state && state?.selectedPurposeIds?.length) {
      state.selectedPurposeIds.forEach((entry) => {
        const purpose = survey?.purposes?.find(
          (p) => String(p._id) === String(entry)
        );

        if (purpose) data.push(purpose);
      });
    } else {
      const initial = survey?.purposes?.find((p) => p.type === "Initial Level");
      if (initial) data.push(initial);
    }

    data.sort(
      (a, b) => LEVEL_ORDER.indexOf(a.type) - LEVEL_ORDER.indexOf(b.type)
    );

    setTableData(data);
  };

  const getSafeChainage = (chainage) => {
    return Number(chainage?.split(survey.separator || "/")[1]);
  };

  const getColor = (type) => {
    if (type.includes("Initial")) return colors.Initial;
    if (type.includes("Proposed")) return colors.Proposed;
    return colors.Final;
  };

  const handleGenerateLs = () => {
    const initialEntry = tableData[0];
    if (!initialEntry?.rows?.length) return;

    const row = initialEntry.rows.filter((row) => row.type === "Chainage");
    if (!row.length) return;

    const pls = Number(initialEntry.pls || 0);

    const safeChainages = row.map((r) => getSafeChainage(r.chainage)) || [];
    const safeInitial = row.map((r) => {
      const offsetPointIndex = r.offsets?.findIndex((o) => Number(o) === pls);

      const safeOffsetPointIndex =
        offsetPointIndex === -1
          ? Math.round(r.offsets.length / 2)
          : offsetPointIndex;

      return r.reducedLevels[safeOffsetPointIndex];
    });

    const data = {
      id,
      type: "ls",
      datum: 9.4,
      chainages: safeChainages,
      series: [],
      allRl: [],
    };

    const makeSeries = (offsets, levels) =>
      offsets.map((o, i) => ({
        x: Number(Number(o).toFixed(3)), // NUMERIC X (IMPORTANT)
        y: Number(Number(levels?.[i] ?? 0).toFixed(3)),
      }));

    // Add the Initial Entry at the end
    data.series.push({
      name: initialEntry.type,
      color: getColor(initialEntry.type),
      data: makeSeries(safeChainages, safeInitial),
    });

    // Add all additional tableData (Proposed, Level 2, etc.)
    if (tableData.length > 1) {
      for (let i = 1; i < tableData.length; i++) {
        const table = tableData[i];

        const newRow = table?.rows?.filter((r) => r.type === "Chainage") || [];
        if (!newRow.length) continue;

        const safeProposal = newRow.map((r) => {
          const offsetPointIndex = r.offsets?.findIndex(
            (o) => Number(o) === pls
          );
          const safeOffsetPointIndex =
            offsetPointIndex === -1
              ? Math.round(r.offsets.length / 2)
              : offsetPointIndex;

          return r.reducedLevels[safeOffsetPointIndex];
        });

        data.allRl.push(...safeProposal);

        data.series.push({
          name: table.type,
          color: getColor(table.type),
          data: makeSeries(safeChainages, safeProposal),
        });
      }
    }

    data.allRl.push(...safeInitial);

    // Compute bounds
    const minY = Math.min(...data.allRl);
    const maxY = Math.max(...data.allRl);

    const pad = (maxY - minY) * 0.1;

    const minX = Math.min(...data.chainages);
    const maxX = Math.max(...data.chainages);

    const xaxis = {
      autorange: false,
      range: [minX, maxX],
      tickformat: ".3f",
      dtick: (maxX - minX) / 4,
      zeroline: false,
      showline: false,
      mirror: true,
    };

    setChartOptions((_) => ({
      ...v1ChartOptions,
      layout: {
        ...v1ChartOptions.layout,
        yaxis: {
          zeroline: false,
          autorange: false,
          range: [minY - 2, maxY + pad],
        },

        xaxis,
      },
    }));

    data.datum = Math.round(minY - 2);
    setSelectedCs(data);
  };

  const fetchSurvey = async () => {
    try {
      if (!global) dispatch(startLoading());
      const { data } = await getSurvey(id);

      if (data.success) {
        handleSetTableData(data.survey);

        setSurvey(data.survey);
      } else {
        throw Error("Failed to fetch survey");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

  useEffect(() => {
    if (tableData.length) {
      handleGenerateLs();
    }
  }, [tableData]);

  return (
    <Box p={2}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        spacing={2}
        mb={2}
      >
        <Typography variant="h6" fontSize={18} fontWeight={700} align="center">
          LONGITUDINAL SECTION
        </Typography>
        <Box textAlign={"end"}>
          <BasicMenu
            label={<BsThreeDots />}
            items={menuItems}
            onSelect={handleMenuSelect}
            sx={{ minWidth: "fit-content", p: 1 }}
          />
        </Box>
      </Stack>
      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {selectedCs && selectedCs?.series?.length && (
          <CrossSectionChart
            selectedCs={selectedCs}
            chartOptions={chartOptions}
            pdfRef={pdfRef}
          />
        )}

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{ mt: 1, fontStyle: "italic", color: "text.secondary" }}
        >
          [Hor Scale – 1 in 150 : Ver Scale – 1 in 150]
        </Typography>
      </Box>
    </Box>
  );
};

export default LongitudinalSectionReport;
