import * as Yup from "yup";
import {
  Box,
  Grid,
  Stack,
  Typography,
  Paper,
  Container,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdArrowBackIosNew } from "react-icons/md";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BasicButtons from "../../components/BasicButton";
import { useDispatch, useSelector } from "react-redux";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import BasicSelect from "../../components/BasicSelect";
import { purposeLevels, proposalLevels } from "../../constants";
import BasicCheckbox from "../../components/BasicCheckbox";
import BasicInput from "../../components/BasicInput";
import {
  createSurveyPurpose,
  generateSurveyPurpose,
  generateWaterWayProposalPurpose,
  getSurvey,
} from "../../services/surveyServices";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import { IoIosArrowForward, IoIosRemove } from "react-icons/io";
import AdvancedAutoComplete from "../../components/AdvancedAutoComplete";
import SmallHeader from "../../components/SmallHeader";
import { IoAdd } from "react-icons/io5";
import { FaLocationArrow } from "react-icons/fa";

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

// Only fields relevant when continuing a survey (id exists)
const inputDetails = [
  {
    label: "Project name*",
    name: "project",
    type: "text",
    for: "All",
  },
  {
    label: "Select purpose*",
    name: "purpose",
    mode: "select",
    options: [{ label: "Initial Level", value: "Initial Level" }],
    for: "All",
  },
  {
    label: "Proposal*",
    name: "proposal",
    mode: "select",
    options: proposalLevels?.map((p) => ({ label: p, value: p })),
    for: "Proposed Level",
    size: 6,
    hidden: true,
  },
  {
    label: "Entry Type",
    name: "entryType",
    mode: "checkbox",
    hidden: true,
    for: "Proposed Level",
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
    for: "Proposed Level",
    hidden: true,
  },
  {
    label: "Quantity*",
    name: "quantity",
    type: "number",
    for: "Proposed Level",
    hidden: true,
  },
  {
    label: "Reduced level*",
    name: "reducedLevel",
    type: "number",
    for: "actual",
  },
  {
    label: "Back sight*",
    name: "backSight",
    type: "number",
    for: "actual",
  },
  {
    label: "Remark*",
    name: "remark",
    type: "text",
    for: "actual",
  },
  {
    label: "Width*",
    name: "width",
    mode: "select",
    options: [
      { label: "Full width", value: "Full width" },
      { label: "Custom", value: "Custom" },
    ],
    hidden: true,
    for: "Proposed Level",
  },
  {
    label: "Length*",
    name: "length",
    mode: "select",
    options: [{ label: "All", value: "All" }],
    hidden: true,
    for: "Proposed Level",
  },
  {
    label: "Cross section type",
    name: "crossSectionType",
    mode: "checkbox",
    hidden: true,
    for: "Proposed Level",
    options: [
      {
        name: "camper",
        label: "Camper",
      },
      {
        name: "slop",
        label: "Slop",
      },
    ],
  },
  {
    label: "",
    name: "cSection",
    type: "number",
    hidden: true,
    for: "Proposed Level",
    size: 6,
  },
  {
    label: "",
    name: "csSlop",
    type: "number",
    hidden: true,
    for: "Proposed Level",
    size: 6,
  },
  {
    label: "Cross section camper",
    name: "csCamper",
    type: "text",
    hidden: true,
    for: "Proposed Level",
    endAdornment: <InputAdornment position="end">%</InputAdornment>,
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
    hidden: true,
    for: "waterWay",
  },
  {
    label: "Bottom width*",
    name: "bottomWidth",
    type: "number",
    hidden: true,
    for: "bottomWidthFixed",
  },
  {
    label: "Side slope ratio (H:V)*",
    name: "slope",
    type: "text",
    hidden: true,
    for: "waterWaySlope",
  },
  {
    label: "Bank limits*",
    name: "bankLimitsMode",
    mode: "select",
    options: [
      { label: "Enter left and right bank offsets", value: "custom" },
      { label: "Recorded width at each chainage, centred on PLS", value: "surveyWidth" },
    ],
    for: "channelBanks",
  },
  { label: "Left bank offset (m)*", name: "leftBankOffset", type: "number", for: "customBanks", size: 6 },
  { label: "Right bank offset (m)*", name: "rightBankOffset", type: "number", for: "customBanks", size: 6 },
  {
    label: "Start RL*",
    name: "startRL",
    type: "number",
    hidden: true,
    for: "slopeEndToEnd",
    size: 6,
  },
  {
    label: "End RL*",
    name: "endRL",
    type: "number",
    hidden: true,
    for: "slopeEndToEnd",
    size: 6,
  },
  {
    label: "Total berm width (m; half on each side)*",
    name: "bermWidth",
    type: "number",
    for: "berm",
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
  backSight: "",
  width: "",
  remark: "TBM - 1",
  reducedLevel: "",
  lSection: "",
  lsSlop: "",
  cSection: "",
  csSlop: "",
  csCamper: "0",
  formula: "Default",
  proposalMethod: "Bottom Width Fixed",
  quantity: "",
  bottomWidth: "",
  startRL: "",
  endRL: "",
  slope: "",
  bermWidth: "",
  bankLimitsMode: "",
  leftBankOffset: "",
  rightBankOffset: "",
  surveyType: "",
};

const ContinueSurveyForm = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const didMount = useRef(false);

  const { global } = useSelector((state) => state.loading);

  const { state } = useLocation();

  const [inputData, setInputData] = useState(inputDetails);

  const [survey, setSurvey] = useState(null);

  const isWaterWay = survey?.type === "Water Way";

  const [type, setType] = useState(state?.fromPL || false);

  const [crossSection, setCrossSection] = useState("camper");

  const [entryType, setEntryType] = useState("autoGenerate");

  const [formValues, setFormValues] = useState(initialFormValues);

  const [formErrors, setFormErrors] = useState(null);

  const [open, setOpen] = useState(false);

  const [btnLoading, setBtnLoading] = useState(false);

  const [selectableItems, setSelectableItems] = useState([]);

  const [rows, setRows] = useState([initialRow]);

  const [selectedPurpose, setSelectedPurpose] = useState(null);

  const [openInterpolationSetup, setOpenInterpolationSetup] = useState(false);

  const schema = Yup.object().shape({
    project: Yup.string().required("Project name is required"),
    purpose: Yup.string().required("Purpose is required"),

    proposal: type
      ? Yup.string().required("Proposal is required")
      : Yup.string().nullable(),

    quantity:
      type && ((isWaterWay && ["Bottom Width Fixed", "With Respect to Berm"].includes(formValues.proposalMethod)) || (!isWaterWay && entryType === "autoGenerate"))
        ? Yup.number().typeError("Excavation quantity is required").positive("Quantity must be greater than zero").required("Quantity is required")
        : Yup.mixed().nullable(),

    width:
      type && entryType === "autoGenerate"
        ? Yup.string().when("surveyType", {
            is: (val) => val !== "Water Way",
            then: (s) => s.required("Width is required"),
            otherwise: (s) => s.nullable(),
          })
        : Yup.string().nullable(),

    length:
      type && entryType === "autoGenerate"
        ? Yup.string().when("surveyType", {
            is: (val) => val !== "Water Way",
            then: (s) => s.required("Length is required"),
            otherwise: (s) => s.nullable(),
          })
        : Yup.string().nullable(),

    formula: Yup.string().nullable(),

    proposedLevel:
      type && entryType === "manualEntry"
        ? Yup.number()
            .typeError("Proposed Level is required")
            .required("Proposed Level is required")
        : Yup.string().nullable(),

    backSight:
      !type
        ? Yup.number()
            .typeError("Backsight is required")
            .required("Backsight is required")
        : Yup.string().nullable(),

    remark: Yup.string().nullable(),

    reducedLevel:
      !type
        ? Yup.number()
            .typeError("Reduced level is required")
            .required("Reduced level is required")
        : Yup.string().nullable(),

    lSection: Yup.string().nullable(),
    lsSlop: Yup.string().nullable(),

    cSection:
      type && crossSection === "slop"
        ? Yup.number()
            .typeError("Cross section slop is required")
            .required("Cross section slop is required")
        : Yup.string().nullable(),

    csSlop:
      type && crossSection === "slop"
        ? Yup.number()
            .typeError("Cross section slop is required")
            .required("Cross section slop is required")
        : Yup.string().nullable(),

    csCamper:
      type && !isWaterWay && crossSection === "camper"
        ? Yup.string().required("Cross section camper is required")
        : Yup.string().nullable(),

    proposalMethod:
      type && isWaterWay
        ? Yup.string().required("Water Way proposal method is required")
        : Yup.string().nullable(),

    bottomWidth:
      type && isWaterWay && formValues.proposalMethod === "Bottom Width Fixed"
        ? Yup.number()
            .typeError("Bottom width is required")
            .required("Bottom width is required")
        : Yup.string().nullable(),

    slope:
      type && isWaterWay
        ? Yup.string().required("Side slope ratio is required").matches(
            /^(\d+(?:\.\d+)?|\.\d+)\s*[:/?]\s*(\d+(?:\.\d+)?|\.\d+)$/,
            "Enter a positive H:V ratio, e.g. 1:1",
          )
        : Yup.string().nullable(),
    bankLimitsMode: type && isWaterWay && formValues.proposalMethod === "Slope End-to-End Type"
      ? Yup.string().oneOf(["custom", "surveyWidth"]).required("Choose bank limits") : Yup.string().nullable(),
    leftBankOffset: type && isWaterWay && formValues.proposalMethod === "Slope End-to-End Type" && formValues.bankLimitsMode === "custom"
      ? Yup.number().typeError("Enter left bank offset").required("Enter left bank offset") : Yup.mixed().nullable(),
    rightBankOffset: type && isWaterWay && formValues.proposalMethod === "Slope End-to-End Type" && formValues.bankLimitsMode === "custom"
      ? Yup.number().typeError("Enter right bank offset").moreThan(Yup.ref("leftBankOffset"), "Right bank must be after left bank").required("Enter right bank offset") : Yup.mixed().nullable(),
    startRL:
      type && isWaterWay && formValues.proposalMethod === "Slope End-to-End Type"
        ? Yup.number()
            .typeError("Start RL is required")
            .required("Start RL is required")
        : Yup.string().nullable(),

    endRL:
      type && isWaterWay && formValues.proposalMethod === "Slope End-to-End Type"
        ? Yup.number()
            .typeError("End RL is required")
            .required("End RL is required")
        : Yup.string().nullable(),

    bermWidth: type && isWaterWay && formValues.proposalMethod === "With Respect to Berm"
      ? Yup.number().typeError("Enter total berm width").min(0, "Berm width must not be negative").required("Enter total berm width")
      : Yup.mixed().nullable(),
  });

  const handleGoBack = () => navigate(-1);

  const handleInputChange = async (event) => {
    const { name, value } = event.target;

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
      setSelectedPurpose(selected);
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
      await schema.validate(formValues, { abortEarly: false });

      const { data } =
        entryType === "autoGenerate" && type === false
          ? await createSurveyPurpose(id, formValues)
          : isWaterWay
            ? await generateWaterWayProposalPurpose(id, formValues)
            : await generateSurveyPurpose(id, {
                ...formValues,
                interpolation: rows,
              });

      if (data.success) {
        const purposeId = data?.survey?.purposeId;
        const surveyStatus = data?.survey?.status;

        const link =
          surveyStatus === "Scheduled"
            ? "/survey"
            : entryType === "autoGenerate" && type === true
              ? `/survey/${id}/report`
              : `/survey/road-survey/${purposeId}/rows`;

        dispatch(startLoading());

        navigate(link, {
          state: surveyStatus === "Scheduled" ? { tab: "todo" } : null,
        });
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
    if (type && entryType === "autoGenerate") {
      setOpen(true);
    } else {
      handleSubmit();
    }
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

      const initialLevel = surveyDoc.purposes?.find(
        (p) => p.type === "Initial Level",
      );

      const updatedFormValues = {
        ...formValues,
        project: surveyDoc?.project,
        reducedLevel: surveyDoc?.reducedLevel || "",
        backSight: initialLevel?.rows[0]?.backSight || "",
        surveyType: surveyDoc?.type || "",
      };

      const completedLevels = surveyDoc?.purposes?.map((p) => p.type) || [];

      const completedPurposes = surveyDoc?.purposes
        ?.filter((p) => p.phase === "Proposal")
        .map((p) => p.type);

      updateInputData(completedLevels, completedPurposes, surveyDoc.type);

      setFormValues(updatedFormValues);
      setSurvey(surveyDoc);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const updateInputData = (completedLevels = [], completedPurposes = [], surveyType = survey?.type) => {
    const isWaterWaySurvey = surveyType === "Water Way";

    setInputData((prev) =>
      prev.map((e) => {
        if (e.for === "All") {
          if (e.name === "purpose") {
            return {
              ...e,
              hidden: false,
              options: type
                ? [
                    completedPurposes?.length
                      ? completedPurposes?.at(-1)
                      : "Initial Level",
                  ].map((p) => ({ label: p, value: p }))
                : purposeLevels
                    ?.filter((p) => !completedLevels.includes(p))
                    .map((p) => ({ label: p, value: p })),
              size: type ? 6 : null,
            };
          }

          if (e.name === "project")
            return { ...e, hidden: false, disabled: true };

          return { ...e, hidden: false };
        }

        if (type && e.for === "Proposed Level") {
          // Hide road-specific fields for Water Way surveys
          if (
            isWaterWaySurvey &&
            ["cSection", "csSlop", "csCamper", "crossSectionType"].includes(e.name)
          ) {
            return { ...e, hidden: true };
          }

          if (!isWaterWaySurvey) {
            if (e.name === "cSection" || e.name === "csSlop") {
              return { ...e, hidden: crossSection === "camper" };
            }

            if (e.name === "csCamper") {
              return { ...e, hidden: crossSection === "slop" };
            }
          }

          if (e.name === "proposedLevel") {
            return { ...e, hidden: entryType === "autoGenerate" };
          }

          if (e.name === "quantity") {
            if (isWaterWaySurvey) {
              return { ...e, hidden: formValues.proposalMethod === "Slope End-to-End Type" };
            }
            return { ...e, hidden: entryType === "manualEntry" };
          }

          if (e.name === "length" || e.name === "width") {
            return { ...e, hidden: entryType === "manualEntry" || isWaterWaySurvey };
          }

          return { ...e, hidden: false };
        }

        if (e.for === "waterWay") {
          return { ...e, hidden: !(type && isWaterWaySurvey) };
        }

        if (e.for === "bottomWidthFixed") {
          return {
            ...e,
            hidden: !(type && isWaterWaySurvey && formValues.proposalMethod === "Bottom Width Fixed"),
          };
        }

        if (e.for === "waterWaySlope") {
          return { ...e, hidden: !(type && isWaterWaySurvey) };
        }
        if (e.for === "channelBanks" || e.for === "customBanks") {
          return { ...e, hidden: !(type && isWaterWaySurvey) || formValues.proposalMethod !== "Slope End-to-End Type" ||
            (e.for === "customBanks" && formValues.bankLimitsMode !== "custom") };
        }
        if (e.for === "slopeEndToEnd") {
          return {
            ...e,
            hidden: !(type && isWaterWaySurvey && formValues.proposalMethod === "Slope End-to-End Type"),
          };
        }

        if (e.for === "berm") {
          return {
            ...e,
            hidden: !(type && isWaterWaySurvey && formValues.proposalMethod === "With Respect to Berm"),
          };
        }

        if (e.for === "actual" && !type) {
          return { ...e, hidden: false };
        }

        if (!type && e.for === "Rest") {
          return { ...e, hidden: false };
        }

        return { ...e, hidden: true };
      }),
    );
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseInterpolationSetup = () => {
    setOpenInterpolationSetup(false);
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
      const completedLevels = survey?.purposes?.map((p) => p.type) || [];

      const completedPurposes =
        survey?.purposes
          ?.filter((p) => p.phase === "Proposal")
          .map((p) => p.type) || [];

      updateInputData(completedLevels, completedPurposes);
    } else {
      didMount.current = true;
    }
  }, [type, crossSection, entryType, formValues.proposalMethod, formValues.bankLimitsMode]);

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: { xs: 8, md: 12 } }}>
      <SmallHeader />

      {/* Internal Modals */}
      <AlertDialogSlide
        {...alertData}
        description={`Are you sure you want to auto-generate the ${formValues?.proposal} for ${formValues.purpose} `}
        open={open}
        onCancel={handleClose}
        onSubmit={handleSubmit}
      />

      <AlertDialogSlide
        {...interpolationSetupAlertData}
        open={openInterpolationSetup}
        onCancel={handleCloseInterpolationSetup}
        onSubmit={handleCloseInterpolationSetup}
      />

      {/* Main Form Layout Container */}
      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 5 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: "28px",
            bgcolor: "#ffffff",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Decorative Gradient Header */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              background: "linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%)",
            }}
          />

          <Stack direction="row" alignItems="center" mb={5} mt={1}>
            <IconButton
              onClick={handleGoBack}
              sx={{
                bgcolor: "#f1f5f9",
                color: "#475569",
                borderRadius: "16px",
                width: 48,
                height: 48,
                mr: 3,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#e2e8f0",
                  color: "#1e293b",
                  transform: "translateX(-2px)",
                },
              }}
            >
              <MdArrowBackIosNew size={22} />
            </IconButton>

            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                color="#1e293b"
                sx={{
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                Continue Your Survey
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                mt={0.5}
              >
                Please fill in the required details accurately
              </Typography>
            </Box>
          </Stack>

          <Stack
            width={"100% !important"}
            spacing={4}
            className="input-wrapper"
          >
            {/* Proposal toggle */}
            <Box
              display={"flex"}
              alignItems={"center"}
              justifyContent={"end"}
            >
              <Typography
                variant="body2"
                fontSize={"16px"}
                fontWeight={600}
                color="black"
              >
                Proposal
              </Typography>
              <BasicCheckbox
                checked={type || ""}
                onChange={() => setType(!type)}
              />
            </Box>

            <Grid container spacing={3} columns={12} alignItems={"end"}>
              {inputData.map(
                ({ hidden, for: inputFor, mode, size, ...input }, index) =>
                  !hidden && (
                    <Grid
                      size={{
                        xs: size || 12,
                      }}
                      key={index}
                    >
                      {((type && input.name === "purpose") ||
                        input.name === "lSection" ||
                        input.name === "cSection") && (
                        <Typography
                          variant="body2"
                          fontSize={"16px"}
                          fontWeight={600}
                          color="black"
                        >
                          {input.name === "purpose"
                            ? "Proposal Between"
                            : input.name === "lSection"
                              ? "Longitudinal section slop"
                              : "Cross section slop"}
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
                      ) : mode === "solo-create" ? (
                        <AdvancedAutoComplete
                          {...input}
                          value={formValues[input.name] || ""}
                          error={(formErrors && formErrors[input.name]) || ""}
                          sx={{ width: "100%" }}
                          onChange={(e) => handleInputChange(e)}
                        />
                      ) : mode === "checkbox" ? (
                        <Stack direction={"row"}>
                          {input.options?.map((option, idx) => (
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

          {/* Submit button */}
          <Stack
            width={"100%"}
            gap={2}
            direction={{ xs: "column", sm: "row" }}
            pt={3}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: "100%" }}
            >
              <BasicButtons
                value={
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FaLocationArrow fontSize="22px" />

                    <Typography
                      fontSize="1.05rem"
                      fontWeight={800}
                      letterSpacing="0.05em"
                    >
                      NEXT
                    </Typography>
                  </Stack>
                }
                sx={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  color: "white",
                  height: "60px",
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
                    boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.5)",
                  },
                }}
                fullWidth={true}
                onClick={preSubmitCheck}
                loading={btnLoading}
              />
            </motion.div>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ContinueSurveyForm;
