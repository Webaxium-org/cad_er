import { surveyBackButtonSx } from "../../components/pageHeaderStyles";
import { applyExampleTemplate, exampleTemplateSeries } from "../../utils/proposalTemplates";
import * as Yup from "yup";
import { islandButtonContentSx, ISLAND_BUTTON_RADIUS, capsuleWrapperSx, capsuleShellSx } from "../../components/bottomIslandStyles";
import {
  Alert, Button, IconButton, Tooltip, LinearProgress, MenuItem, TextField,
  Box,
  Container,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { FiGrid, FiList, FiLayout, FiCornerUpLeft, FiCornerUpRight, FiFolder } from "react-icons/fi";
import { FaLocationArrow } from "react-icons/fa";
import { IoAdd } from "react-icons/io5";
import { IoIosRemove } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import BasicButton from "../../components/BasicButton";
import BasicCheckbox from "../../components/BasicCheckbox";
import BasicInput from "../../components/BasicInput";
import BasicSelect from "../../components/BasicSelect";
import SmallHeader from "../../components/SmallHeader";
import PageHeroHeader from "../../components/PageHeroHeader";
import { proposalLevels } from "../../constants";
import {
  previewProposalWorkspace,
  saveProposalWorkspace,
  getSurvey,
} from "../../services/surveyServices";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";

import ProposalProfileGraph from "./components/ProposalProfileGraph";
import ProposalDesignControls from "./components/ProposalDesignControls";
import { initialProposalDesign, proposalGraphSeries, proposalWorkspaceRequest, stoppingSightDistance } from "../../utils/proposalWorkspace";

import { initialPreviewState, proposalPreviewReducer } from "../../utils/proposalPreviewState";

import { calculateVolumeReport } from "../../utils/volumeReport";

const alertData = {
  title: "Generate Proposal",
  description: "",
  content: "",
  cancelButtonText: "Cancel",
  submitButtonText: "Continue",
};

const addButtonSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.5,
  py: 0.75,
  borderRadius: 2,
  bgcolor: "primary.50",
  color: "primary.main",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  transition: "all 0.2s",
  "&:hover": {
    bgcolor: "primary.100",
  },
};

const historyActionSx = {
  width: 34, height: 34, p: 0.75, flexShrink: 0,
  color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px",
  "& svg": { width: 18, height: 18 },
  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
  "&.Mui-disabled": { color: "rgba(255,255,255,0.35)" },
};

const designGroupSx = {
  m: 0, px: { xs: 1.25, sm: 2 }, pt: 1, pb: 1.5, minWidth: 0,
  border: "1px solid #dce0ef", borderRadius: "14px",
  "& .MuiInputBase-root": { fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 1, sm: 1.75 }, minHeight: 40 },
  "& .MuiSelect-select": { paddingRight: "22px !important" },
  "& .MuiSelect-icon": { right: 4 },
  "& > legend": { px: 0.75, color: "#334155", fontSize: "0.85rem", fontWeight: 600 },
};

const inputDetails = [
  {
    label: "Project name*",
    name: "project",
    type: "text",
  },
  {
    label: "Select purpose*",
    name: "purpose",
    mode: "select",
    options: [{ label: "Initial Level", value: "Initial Level" }],
    size: 6,
  },
  {
    label: "Proposal*",
    name: "proposal",
    mode: "select",
    options: proposalLevels?.map((p) => ({ label: p, value: p })),
    size: 6,
  },
  {
    label: "Entry Type",
    name: "entryType",
    mode: "checkbox",
    options: [
      {
        name: "autoGenerate",
        label: "Auto Generate",
      },
      {
        name: "manualEntry",
        label: "Manual entry",
      },
    ],
  },
  {
    label: "Proposed level*",
    name: "proposedLevel",
    type: "number",
    for: "manualOrWaterWay",
  },
  {
    label: "Water Way proposal method*",
    name: "proposalMethod",
    mode: "select",
    options: [
      { label: "Bottom Width Fixed", value: "Bottom Width Fixed" },
      { label: "Slope End-to-End Type", value: "Slope End-to-End Type" },
      { label: "With Respect to Berm", value: "With Respect to Berm" },
    ],
    for: "waterWay",
  },
  {
    label: "Bottom width*",
    name: "bottomWidth",
    type: "number",
    for: "bottomWidthFixed",
  },
  {
    label: "Side slope ratio (V:H)*",
    name: "slope",
    type: "text",
    for: "waterWaySlope",
  },
  {
    label: "Total berm width (m; half on each side)*",
    name: "bermWidth",
    type: "number",
    for: "berm",
  },
  {
    label: "Quantity*",
    name: "quantity",
    type: "number",
    for: "autoGenerate",
  },
  {
    label: "Width*",
    name: "width",
    mode: "select",
    options: [
      { label: "All", value: "Full width" },
      { label: "Custom", value: "Custom" },
    ],
    for: "autoGenerate",
  },
  {
    label: "Length*",
    name: "length",
    mode: "select",
    options: [{ label: "All", value: "All" }, { label: "Custom", value: "Custom" }],
    for: "autoGenerate",
  },
  {
    label: "Cross section type",
    name: "crossSectionType",
    mode: "checkbox",
    options: [
      {
        name: "camper",
        label: "Camper",
      },
      {
        name: "slop",
        label: "Slope",
      },
    ],
  },
  {
    label: "",
    name: "cSection",
    type: "number",
    for: "slop",
    size: 6,
  },
  {
    label: "",
    name: "csSlop",
    type: "number",
    for: "slop",
    size: 6,
  },
  {
    label: "Cross section camper",
    name: "csCamper",
    type: "text",
    for: "camper",
    endAdornment: <InputAdornment position="end">%</InputAdornment>,
  },
];

const initialRow = {
  from: "",
  to: "",
  width: "",
};

const initialFormValues = {
  project: "",
  purpose: "",
  proposal: "",
  width: "",
  quantity: "",
  length: "",
  proposedLevel: "",
  proposalMethod: "Bottom Width Fixed",
  bottomWidth: "",
  slope: "",
  bermWidth: "",
  cSection: "",
  csSlop: "",
  csCamper: "0",
  formula: "Default",
};

const islandOptions = [
  {
    label: "CS",
    value: "cs",
    icon: <FiGrid />,
  },
  {
    label: "LS",
    value: "ls",
    icon: <FiList />,
  },
  {
    label: "TEMPLATES",
    value: "templates",
    icon: <FiLayout />,
  },
];

export default function ProposeLevel() {
  const outerTheme = useTheme();
  const proposalTheme = useMemo(() => createTheme(outerTheme, {
    palette: { primary: { main: "#6366f1", light: "#a5b4fc", dark: "#4f46e5", contrastText: "#ffffff" } },
  }), [outerTheme]);
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const didMount = useRef(false);
  const { global } = useSelector((state) => state.loading);

  const [compactHeroHeight, setCompactHeroHeight] = useState(0);
  const [activeIsland, setActiveIsland] = useState("ls");
  const [survey, setSurvey] = useState(null);
  const [crossSection, setCrossSection] = useState("camper");
  const [entryType, setEntryType] = useState("autoGenerate");
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState(null);
  const [open, setOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectableItems, setSelectableItems] = useState([]);
  const [rows, setRows] = useState([initialRow]);
  const [openInterpolationSetup, setOpenInterpolationSetup] = useState(false);
  const [openLengthSetup, setOpenLengthSetup] = useState(false);
  const [lengthDraft, setLengthDraft] = useState({ from: "", to: "" });
  const [lengthError, setLengthError] = useState("");
  const openCustomLength = () => {
    setLengthDraft(formValues.chainageRange || { from: "", to: "" });
    setLengthError("");
    setOpenLengthSetup(true);
  };
  const [inputData, setInputData] = useState(inputDetails);
  const [design, setDesign] = useState(() => structuredClone(initialProposalDesign));
  const [{ purpose: preview, busy: previewBusy, error: previewError, validation: previewValidation }, dispatchPreview] = useReducer(proposalPreviewReducer, initialPreviewState);
  const [selectedChainage, setSelectedChainage] = useState("");
  const proposalSnapshot = JSON.stringify({ formValues, design, crossSection, entryType, rows });
  const [editHistory, setEditHistory] = useState({ survey: null, past: [], present: null, future: [] });
  useEffect(() => {
    if (!survey) return;
    setEditHistory(previous => {
      if (previous.survey !== survey) return { survey, past: [], present: proposalSnapshot, future: [] };
      if (previous.present === proposalSnapshot) return previous;
      return { survey, past: [...previous.past, previous.present].slice(-100), present: proposalSnapshot, future: [] };
    });
  }, [proposalSnapshot, survey]);
  const restoreProposal = (direction) => {
    const source = direction === "undo" ? editHistory.past : editHistory.future;
    if (!source.length) return;
    const snapshot = source.at(-1);
    const restored = JSON.parse(snapshot);
    setFormValues(restored.formValues);
    setDesign(restored.design);
    setCrossSection(restored.crossSection);
    setEntryType(restored.entryType);
    setRows(restored.rows);
    setFormErrors(null);
    setEditHistory(previous => direction === "undo"
      ? { ...previous, past: previous.past.slice(0, -1), present: snapshot, future: [...previous.future, previous.present] }
      : { ...previous, past: [...previous.past, previous.present], present: snapshot, future: previous.future.slice(0, -1) });
  };
  const basePurpose = useMemo(() => survey?.purposes?.find((purpose) => purpose.type === formValues.purpose), [survey, formValues.purpose]);
  const stations = useMemo(() => basePurpose?.rows?.filter((row) => row.type === "Chainage") || [], [basePurpose]);
  const isWaterWay = survey?.type === "Water Way";

  const schema = useMemo(() => Yup.object().shape({
    project: Yup.string().required("Project name is required"),
    purpose: Yup.string().required("Purpose is required"),
    proposal: Yup.string().required("Proposal is required"),
    quantity:
      (entryType === "autoGenerate" && !isWaterWay) ||
      isWaterWay
        ? Yup.number()
            .typeError("Quantity is required")
            .required("Quantity is required")
        : Yup.string().nullable(),
    width:
      entryType === "autoGenerate" && !isWaterWay
        ? Yup.string().required("Width is required")
        : Yup.string().nullable(),
    length:
      entryType === "autoGenerate" && !isWaterWay
        ? Yup.string().required("Length is required")
        : Yup.string().nullable(),
    proposedLevel:
      entryType === "manualEntry" && !isWaterWay
        ? Yup.number()
            .typeError("Proposed Level is required")
            .required("Proposed Level is required")
        : Yup.string().nullable(),
    cSection: Yup.string().nullable(),
    csSlop: Yup.string().nullable(),
    csCamper: Yup.string().nullable(),
    formula: Yup.string().nullable(),
  }), [isWaterWay, entryType]);

  const request = useMemo(() => proposalWorkspaceRequest(formValues, design, rows, isWaterWay), [formValues, design, rows, isWaterWay]);
  const validateWorkspace = useCallback(async () => {
    if (design.mode === "manual") {
      if (!formValues.project || !formValues.purpose || !formValues.proposal) throw Error("Choose the base and proposal levels.");
      if (!stations.length || stations.some((row) => design.manualLevels[row.chainage] == null || String(design.manualLevels[row.chainage]).trim() === "" || !Number.isFinite(Number(design.manualLevels[row.chainage])))) throw Error("Enter a valid RL for every chainage.");
      return;
    }
    if (formValues.length === "Custom") {
      const from = stations.findIndex(row => row.chainage === formValues.chainageRange?.from);
      const to = stations.findIndex(row => row.chainage === formValues.chainageRange?.to);
      if (from < 0 || to <= from) throw Error("Select a From chainage and a later To chainage.");
    }
    const values = design.mode === "dimensions" ? { ...formValues, quantity: Number(design.dimensions.length) * Number(design.dimensions.width) * Number(design.dimensions.height), width: "Custom", length: "All", bottomWidth: design.dimensions.width } : formValues;
    await schema.validate(values, { abortEarly: false });
  }, [design, formValues, schema, stations]);

  useEffect(() => {
    if (!survey?._id) return;
    const controller = new AbortController();
    const context = JSON.stringify([id, request.form.purpose, request.form.proposal]);
    dispatchPreview({ type: "start", context });
    const timer = setTimeout(async () => {
      try {
        await validateWorkspace();
        const { data } = await previewProposalWorkspace(id, request, controller.signal);
        if (!controller.signal.aborted) dispatchPreview({ type: "success", context, purpose: data.purpose });
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error.response?.data?.message || (error.inner?.length ? [...new Set(error.inner.map(issue => issue.message))].join(" ") : error.message);
          dispatchPreview({ type: "failure", context, validation: error.name === "ValidationError", error: message || "Unable to calculate the proposal. Check the design inputs." });
        }
      }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [id, survey?._id, request, validateWorkspace]);

  const graphType = activeIsland === "ls" ? "ls" : "cs";
  const graphSeries = useMemo(() => proposalGraphSeries(basePurpose, preview, graphType, selectedChainage || stations[0]?.chainage, survey?.separator || "/"), [basePurpose, preview, graphType, selectedChainage, stations, survey?.separator]);
  const templateSeries = useMemo(() => exampleTemplateSeries(design), [design]);
  const previewQuantity = useMemo(() => preview && basePurpose ? calculateVolumeReport(survey, basePurpose, preview) : null, [survey, basePurpose, preview]);

  const updateInputData = (completedPurposes = [], surveyType = survey?.type) => {
    const isWaterWaySurvey = surveyType === "Water Way";

    setInputData((prev) =>
      prev.map((input) => {
        if (input.name === "purpose") {
          return {
            ...input,
            options: [
              completedPurposes?.length
                ? completedPurposes?.at(-1)
                : "Initial Level",
            ].map((p) => ({ label: p, value: p })),
          };
        }

        if (input.name === "crossSectionType") return { ...input, hidden: false };
        if (input.name === "entryType") {
          return { ...input, hidden: isWaterWaySurvey };
        }

        if (input.name === "proposedLevel") {
          return {
            ...input,
            hidden:
              isWaterWaySurvey || entryType === "autoGenerate",
          };
        }

        if (input.name === "quantity") {
          return {
            ...input,
            hidden:
              isWaterWaySurvey
                ? false
                : entryType === "manualEntry",
          };
        }

        if (input.for === "waterWay") {
          return { ...input, hidden: !isWaterWaySurvey };
        }

        if (input.for === "bottomWidthFixed") {
          return {
            ...input,
            hidden:
              !isWaterWaySurvey ||
              formValues.proposalMethod !== "Bottom Width Fixed",
          };
        }

        if (input.for === "waterWaySlope") {
          return { ...input, hidden: !(isWaterWaySurvey) };
        }
        if (input.for === "berm") {
          return {
            ...input,
            hidden:
              !isWaterWaySurvey ||
              formValues.proposalMethod !== "With Respect to Berm",
          };
        }

        if (input.for === "autoGenerate") {
          return {
            ...input,
            hidden: isWaterWaySurvey || entryType === "manualEntry",
          };
        }

        if (input.for === "slop") {
          return {
            ...input,
            hidden: isWaterWaySurvey || crossSection === "camper",
          };
        }

        if (input.for === "camper") {
          return {
            ...input,
            hidden: isWaterWaySurvey || crossSection === "slop",
          };
        }

        return { ...input, hidden: false };
      }),
    );
  };

  const fetchData = async () => {
    try {
      if (!global) dispatch(startLoading());

      const { data } = await getSurvey(id);

      if (data?.survey?.isSurveyFinish) {
        navigate("/survey");
        throw Error("The survey already completed");
      }

      const surveyDoc = data.survey;
      const completedPurposes =
        surveyDoc?.purposes
          ?.filter((p) => p.phase === "Proposal")
          .map((p) => p.type) || [];
setFormValues((prev) => ({
        ...prev,
        project: surveyDoc?.project || "",
        purpose: "",
        proposal: "",
      }));
      setSurvey(surveyDoc);
      setCrossSection(surveyDoc?.type === "Water Way" ? "slop" : "camper");
      setDesign((previous) => ({ ...previous, template: surveyDoc?.type === "Water Way" ? "water" : surveyDoc?.type === "Rail Way" ? "rail" : "road",
        ls: { ...previous.ls, quantityType: surveyDoc?.type === "Water Way" ? "cutting" : "filling" },
        cs: { ...previous.cs, camberEnabled: ["Road Survey", "Road Way"].includes(surveyDoc?.type), camber: previous.cs.camber ?? "0", superelevationEnabled: false, slopeEnabled: surveyDoc?.type === "Water Way", horizontal: "1", vertical: surveyDoc?.type === "Water Way" ? "1" : "0", fixedBottomEnabled: false } }));
      updateInputData(completedPurposes, surveyDoc?.type);

      setSelectableItems([]);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const handleInputChange = async (event) => {
    const { name, value } = event.target;
    if (name === "length" && value === "Custom") {
      openCustomLength();
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "purpose") {
      const selected = survey?.purposes?.find((p) => p.type === value);
      const items =
        selected?.rows
          ?.filter((r) => r.type === "Chainage" || r.type === "Water Level")
          ?.map((s) => ({
            label: s.chainage,
            value: s.chainage,
          })) || [];

      setSelectableItems(items);
    }

    if (name === "width") {
      if (value !== "Custom") {
        setRows([initialRow]);
      }

      setOpenInterpolationSetup(value === "Custom");
    }

    try {
      await Yup.reach(schema, name).validate(value);
      setFormErrors({ ...formErrors, [name]: null });
    } catch (error) {
      setFormErrors({ ...formErrors, [name]: error.message });
    }
  };

  const handleSubmit = async () => {
    setBtnLoading(true);

    try {
      await validateWorkspace();
      const { data } = await saveProposalWorkspace(id, request);

      if (data.success) {
        dispatch(startLoading());
        navigate(`/survey/${id}/report`);
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setOpen(false);
      setBtnLoading(false);
    }
  };

  const preSubmitCheck = () => {
    if (entryType === "autoGenerate") {
      setOpen(true);
    } else {
      handleSubmit();
    }
  };

  const getIndex = (value) =>
    selectableItems.findIndex((i) => i.value === value);

  const getFromOptions = (rowIndex) => {
    if (rowIndex === 0) return selectableItems;
    const prevTo = rows[rowIndex - 1]?.to;
    if (!prevTo) return [];
    const prevToIndex = getIndex(prevTo);
    return selectableItems.slice(prevToIndex);
  };

  const getToOptions = (rowIndex) => {
    const fromValue = rows[rowIndex]?.from;
    if (!fromValue) return [];
    const fromIndex = getIndex(fromValue);
    return selectableItems.slice(fromIndex + 1);
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const updatedRow = {
        ...prev[index],
        [field]: value,
        ...(field === "from" ? { to: "" } : {}),
      };

      if (!updatedRow.to) {
        return [...prev.slice(0, index), updatedRow];
      }

      const updatedToIndex = getIndex(updatedRow.to);

      const validNextRows = prev.slice(index + 1).filter((row) => {
        if (!row.from) return false;
        return getIndex(row.from) >= updatedToIndex;
      });

      return [...prev.slice(0, index), updatedRow, ...validNextRows];
    });
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1];
      return [
        ...prev,
        {
          from: lastRow.to || "",
          to: "",
          remark: "",
        },
      ];
    });
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const interpolationSetupAlertData = {
    title: (
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        Interpolation Setup{" "}
        <Box sx={addButtonSx} onClick={handleAddRow}>
          <IoAdd size={18} />
          Add Range
        </Box>
      </Stack>
    ),
    description: "",
    content: (
      <Box mt={2}>
        {rows?.map((row, index) => (
          <Stack
            direction="row"
            spacing={2}
            alignItems="end"
            mb={2}
            key={index}
          >
            <BasicSelect
              label="From"
              value={row.from}
              options={getFromOptions(index)}
              onChange={(e) => handleRowChange(index, "from", e.target.value)}
            />

            <BasicSelect
              label="To"
              value={row.to}
              options={getToOptions(index)}
              onChange={(e) => handleRowChange(index, "to", e.target.value)}
            />

            <BasicInput
              label="Width"
              value={row.width}
              type="number"
              onChange={(e) => handleRowChange(index, "width", e.target.value)}
            />

            <Box onClick={() => handleRemoveRow(index)}>
              <IoIosRemove />
            </Box>
          </Stack>
        ))}
      </Box>
    ),
    cancelButtonText: "Cancel",
    submitButtonText: "Continue",
  };

  useEffect(() => {
    if (didMount.current) {
      const completedPurposes =
        survey?.purposes
          ?.filter((p) => p.phase === "Proposal")
          .map((p) => p.type) || [];
      updateInputData(completedPurposes);
    } else {
      didMount.current = true;
    }
  }, [crossSection, entryType, formValues.proposalMethod, formValues.bankLimitsMode, survey?.type]);

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <ThemeProvider theme={proposalTheme}>
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: { xs: 12, md: 14 } }}>
      <SmallHeader />
      <PageHeroHeader title="Propose Level" subtitle={`Live ${activeIsland === "templates" ? "template" : activeIsland.toUpperCase()} Design level preview`} onCompactHeightChange={setCompactHeroHeight}
        compactTitle="Propose Level"
        compactSubtitle={`Live ${activeIsland === "templates" ? "template" : activeIsland.toUpperCase()} Design level preview`}
        backButtonSx={surveyBackButtonSx}
        action={<Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Undo"><span><IconButton size="small" aria-label="Undo proposal change" disabled={!editHistory.past.length || btnLoading} onClick={() => restoreProposal("undo")} sx={historyActionSx}><FiCornerUpLeft /></IconButton></span></Tooltip>
          <Tooltip title="Redo"><span><IconButton size="small" aria-label="Redo proposal change" disabled={!editHistory.future.length || btnLoading} onClick={() => restoreProposal("redo")} sx={historyActionSx}><FiCornerUpRight /></IconButton></span></Tooltip>
          {activeIsland !== "ls" && <TextField select size="small" sx={{ width: { xs: 140, sm: 200 }, bgcolor: "white", borderRadius: 2, "& .MuiInputLabel-root": { bgcolor: "white", px: 0.5, borderRadius: 1 } }} label="Chainage" value={selectedChainage || stations[0]?.chainage || ""} onChange={(event) => setSelectedChainage(event.target.value)}>{stations.map((row) => <MenuItem key={row.chainage} value={row.chainage}>{row.chainage}</MenuItem>)}</TextField>}
        </Stack>}
        onBack={() => navigate(-1)} />

      <AlertDialogSlide
        {...alertData}
        description={`Are you sure you want to auto-generate the ${formValues?.proposal} for ${formValues.purpose} `}
        open={open}
        onCancel={() => setOpen(false)}
        onSubmit={handleSubmit}
      />

      <AlertDialogSlide
        {...interpolationSetupAlertData}
        open={openInterpolationSetup}
        onCancel={() => setOpenInterpolationSetup(false)}
        onSubmit={() => setOpenInterpolationSetup(false)}
      />

      <AlertDialogSlide open={openLengthSetup} title="Custom length" cancelButtonText="Cancel" submitButtonText="Continue"
        onCancel={() => setOpenLengthSetup(false)}
        onSubmit={() => {
          const from = stations.findIndex(row => row.chainage === lengthDraft.from);
          const to = stations.findIndex(row => row.chainage === lengthDraft.to);
          if (from < 0 || to <= from) {
            setLengthError("Select a From chainage and a later To chainage.");
            return;
          }
          setFormValues(previous => ({ ...previous, length: "Custom", chainageRange: { ...lengthDraft } }));
          setFormErrors(previous => ({ ...previous, length: null }));
          setOpenLengthSetup(false);
        }}
        content={<Stack spacing={2} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {["from", "to"].map(end => <BasicSelect key={end} label={end === "from" ? "From" : "To"}
              displayEmpty placeholder="Select chainage" inputProps={{ "aria-label": end === "from" ? "From chainage" : "To chainage" }}
              options={stations.map(row => ({ label: row.chainage, value: row.chainage }))}
              value={lengthDraft[end]} sx={{ minWidth: 0 }}
              onChange={event => { setLengthDraft(previous => ({ ...previous, [end]: event.target.value })); setLengthError(""); }} />)}
          </Stack>
          {lengthError && <Alert severity="error">{lengthError}</Alert>}
        </Stack>} />

      <Container maxWidth="lg" disableGutters sx={{ mt: -8, position: "relative", width: "100%", minWidth: 0, px: { lg: 3 } }}>
        <ProposalProfileGraph previewMessage={activeIsland !== "templates" && previewError && !previewValidation ? `${preview ? "Showing the last calculated profile. " : "Proposed preview unavailable. "}${previewError}` : undefined} totals={activeIsland === "ls" ? previewQuantity : null} totalsStale={previewBusy || Boolean(previewError)} stickyTop={{ xs: 49 + compactHeroHeight, md: 65 + compactHeroHeight }} series={activeIsland === "templates" && design.templateId ? templateSeries : graphSeries} title={activeIsland === "templates" && design.templateId ? "Example CS preview" : undefined} type={graphType} ssd={graphType === "ls" && design.ssd.enabled ? stoppingSightDistance(design.ssd) : null} />
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3, lg: 0 } }}>
        {activeIsland === "templates" && design.templateId && <Alert severity="info" sx={{ mb: 2 }}>Illustrative profile: 1 m side height and an arbitrary 100 m datum. Edit the CS dimensions for your project; the actual proposal uses surveyed levels.</Alert>}
        {previewBusy && <LinearProgress sx={{ mb: 1, borderRadius: 2 }} />}

        {previewQuantity && (activeIsland !== "ls" || previewQuantity.missingSections?.length > 0) && <Stack direction="row" gap={2} flexWrap="wrap" sx={{ mb: 2 }}><Typography fontWeight={800} color="#b45309">Cutting {previewQuantity.totalCuttingVolume.toFixed(3)} m&sup3;</Typography><Typography fontWeight={800} color="#2878c7">Filling {previewQuantity.totalFillingVolume.toFixed(3)} m&sup3;</Typography>{previewQuantity.missingSections?.length > 0 && <Typography color="error">Quantity incomplete: missing cross-sections.</Typography>}</Stack>}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 5 },
            borderRadius: "28px",
            bgcolor: "#ffffff",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            borderLeftColor: "#6366f1",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", bgcolor: "#6366f1" }} />

          <Stack width={"100% !important"} spacing={4} className="input-wrapper">
            {activeIsland === "ls" && <Stack spacing={2}>
              <Box component="fieldset" sx={designGroupSx}>
                <Box component="legend">Select design layer</Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  {["purpose", "proposal"].map(name => <BasicSelect key={name} name={name}
                    options={inputData.find(input => input.name === name)?.options || []}
                    placeholder="Select layer" displayEmpty
                    inputProps={{ "aria-label": name === "purpose" ? "Base layer" : "Proposal layer" }}
                    value={formValues[name] || ""} onChange={handleInputChange}
                    error={formErrors?.[name] || ""} sx={{ minWidth: 0 }} />)}
                </Box>
              </Box>
              <Box component="fieldset" sx={designGroupSx}>
                <Box component="legend">Mark dimensions</Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                  {["quantity", "length", "width"].map(name => {
                    const input = inputData.find(item => item.name === name);
                    const placeholder = name === "quantity" ? "Quantity (m³)" : name === "length" ? "Length (m)" : "Width (m)";
                    const props = { name, placeholder, value: formValues[name] ?? "", onChange: handleInputChange,
                      error: formErrors?.[name] || "", inputProps: { "aria-label": placeholder } };
                    return <Box key={name} sx={{ minWidth: 0 }}>{input?.mode === "select"
                      ? <BasicSelect {...props} options={input.options} displayEmpty />
                      : <BasicInput {...props} type="number" />}</Box>;
                  })}
                </Box>
              </Box>
              <Box component="fieldset" sx={designGroupSx}>
                <Box component="legend">Design condition</Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 1.5 }}>
                  <BasicSelect value={design.ls.quantityType} displayEmpty placeholder="Filling / Cutting"
                    options={[{ label: "Filling", value: "filling" }, { label: "Cutting", value: "cutting" }]}
                    inputProps={{ "aria-label": "Design condition" }} sx={{ minWidth: 0 }}
                    onChange={event => setDesign(previous => ({ ...previous, ls: { ...previous.ls, quantityType: event.target.value } }))} />
                </Box>
              </Box>
            </Stack>}
            {activeIsland === "ls" && formValues.length === "Custom" && <Box>
              <Button onClick={openCustomLength} sx={{ textTransform: "none" }}>
                Length: {formValues.chainageRange?.from} ? {formValues.chainageRange?.to} ? Edit
              </Button>
            </Box>}
            <Grid container spacing={3} columns={12} alignItems={"end"} sx={{ "&:empty": { display: "none" } }}>
              {inputData.filter((input) => {
                if (["project", "purpose", "proposal", "quantity", "length", "width", "entryType", "proposedLevel", "crossSectionType", "cSection", "csSlop", "csCamper"].includes(input.name)) return false;
                if (design.mode === "manual" && !["project", "purpose", "proposal"].includes(input.name)) return false;
                if (design.mode === "dimensions" && ["quantity", "width", "length"].includes(input.name)) return false;
                const csField = ["crossSectionType", "cSection", "csSlop", "csCamper", "proposalMethod", "bottomWidth", "slope", "bermWidth"].includes(input.name);
                return activeIsland === "ls" && !csField;
              }).map(
                ({ hidden, mode, size, ...input }, index) =>
                  !hidden && (
                    <Grid
                      size={{
                        xs: size || 12,
                      }}
                      key={index}
                    >
                      {(input.name === "cSection") && (
                        <Typography
                          variant="body2"
                          fontSize={"16px"}
                          fontWeight={600}
                          color="black"
                        >
                          Cross section slope
                          :
                        </Typography>
                      )}

                      {mode === "select" ? (
                        <BasicSelect
                          {...input}
                          value={formValues[input.name] || ""}
                          error={(formErrors && formErrors[input.name]) || ""}
                          sx={{ width: "100%" }}
                          onChange={(e) => handleInputChange(e)}
                        />
                      ) : mode === "checkbox" ? (
                        <Stack direction={"row"}>
                          {input.options?.filter(option => !(isWaterWay && input.name === "crossSectionType" && option.name === "camper")).map((option, idx) => (
                            <Box
                              display={"flex"}
                              alignItems={"center"}
                              key={idx}
                            >
                              <Typography
                                variant="body2"
                                fontSize={"16px"}
                                fontWeight={600}
                                color="black"
                              >
                                {option.label}
                              </Typography>
                              <BasicCheckbox
                                checked={
                                  (input.name === "crossSectionType"
                                    ? crossSection
                                    : entryType) === option.name
                                }
                                onChange={() =>
                                  input.name === "crossSectionType"
                                    ? setCrossSection(option.name)
                                    : setEntryType(option.name)
                                }
                              />
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <BasicInput
                          {...input}
                          value={formValues[input.name] || ""}
                          error={(formErrors && formErrors[input.name]) || ""}
                          sx={{ width: "100%" }}
                          onChange={(e) => handleInputChange(e)}
                        />
                      )}
                    </Grid>
                  ),
              )}
            </Grid>
          </Stack>

          <ProposalDesignControls designLayerSelected={Boolean(formValues.purpose && formValues.proposal)} profileName={formValues.proposal} previewValidation={previewValidation} previewBusy={previewBusy} previewError={previewError} startRl={preview ? graphSeries[1]?.points.find(Boolean)?.y : null} startChainage={preview?.rows?.find(row => row.type === "Chainage")?.chainage || stations[0]?.chainage} isWaterWay={isWaterWay} crossSection={crossSection} tab={activeIsland} design={design} onChange={setDesign} stations={stations}
            onTemplate={(preset) => {
              setCrossSection("slop");
              setDesign(previous => applyExampleTemplate(previous, preset));
            }} />
        </Paper>
        <Paper component="section" aria-label="Project details" elevation={0} sx={{
          mt: 2.5, p: { xs: 2.5, md: 3 }, borderRadius: "24px",
          background: "linear-gradient(120deg, #4f46e5 0%, #6366f1 70%, #7775f5 100%)",
          color: "white", border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 10px 28px -12px rgba(79,70,229,0.4)",
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box aria-hidden="true" sx={{ width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 },
              display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}>
              <FiFolder size={24} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Project name</Typography>
              <Typography sx={{ mt: 0.5, overflowWrap: "anywhere", fontWeight: 700,
                fontSize: { xs: "1.1rem", sm: "1.3rem" }, lineHeight: 1.35 }}>{formValues.project || "?"}</Typography>
            </Box>
          </Stack>
        </Paper>
        </Container>
      </Container>

      <Box
        component={motion.div}
        initial={{ y: 100, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100,
          delay: 0.2,
        }}
        sx={{
          position: "fixed",
          left: "50%",
          zIndex: 1002,
          ...capsuleWrapperSx(4),
        }}
      >
        <Paper
          elevation={0}
          sx={{
            background: "rgba(99, 102, 241, 0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.2)",
            ...capsuleShellSx,
          }}
        >
          {[islandOptions[1], islandOptions[0], islandOptions[2]].map((option) => (
            <Box
              key={option.value}
              component="button"
              type="button"
              aria-pressed={activeIsland === option.value}
              sx={{
                border: 0,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 0.5, md: 2 },
                height: "100%",
                borderRadius: ISLAND_BUTTON_RADIUS,
                                cursor: "pointer",
                minWidth: 0,
                whiteSpace: "nowrap",
                flex: "1 1 0",
                bgcolor: "white",
                color: activeIsland === option.value ? "white" : "#6366f1",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: activeIsland === option.value ? "white" : "#f8fafc",
                },
              }}
              onClick={() => setActiveIsland(option.value)}
            >
              {activeIsland === option.value && (
                <Box
                  component={motion.div}
                  layoutId="activeProposalType"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "#6366f1",
                    borderRadius: ISLAND_BUTTON_RADIUS,
                    zIndex: 0,
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                  }}
                />
              )}

              <Box
                sx={{
                  ...islandButtonContentSx(4, "TEMPLATES"),
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={900}
                  sx={{
                    lineHeight: 1,
                    position: "relative",
                    zIndex: 1,
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.3s ease",
                  }}
                >
                  {option.icon}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  letterSpacing={0}
                  sx={{
                    lineHeight: 1,
                    position: "relative",
                    zIndex: 1,
                    color: "inherit",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    transition: "color 0.3s ease",
                  }}
                >
                  {option.label}
                </Typography>
              </Box>
            </Box>
          ))}
          <BasicButton value={
            <Stack direction="column" sx={islandButtonContentSx(4, "NEXT", 17)}>
              <FaLocationArrow fontSize="22px" />
              <Typography fontSize="1.1rem" fontWeight={600} letterSpacing="0.05em">NEXT</Typography>
            </Stack>
          } loading={btnLoading}
            disabled={previewBusy || !preview || Boolean(previewError) || Boolean(previewQuantity?.missingSections?.length)}
            onClick={preSubmitCheck} sx={{ flex: "1 1 0", minWidth: 0, borderRadius: ISLAND_BUTTON_RADIUS, bgcolor: "#595cf2", color: "white", px: { xs: 0.5, sm: 2 }, whiteSpace: "normal", lineHeight: 1.2, fontSize: { xs: "0.7rem", sm: "0.875rem" },
              "& .MuiButton-startIcon": { display: { xs: "none", sm: "inline-flex" } } }} />
        </Paper>
      </Box>
    </Box>
    </ThemeProvider>
  );
}
