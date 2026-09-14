import * as Yup from "yup";
import {
  Box,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdArrowBackIosNew, MdOutlineGridView, MdOutlineTableRows } from "react-icons/md";
import { FaLocationArrow } from "react-icons/fa";
import { TbTemplate } from "react-icons/tb";
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
import { proposalLevels } from "../../constants";
import {
  generateSurveyPurpose,
  generateWaterWayProposalPurpose,
  getSurvey,
} from "../../services/surveyServices";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { handleFormError } from "../../utils/handleFormError";

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
      { label: "With Respect to Buffer", value: "With Respect to Buffer" },
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
    label: "Side slope ratio (H:V)*",
    name: "slope",
    type: "text",
    for: "waterWaySlope",
  },
  {
    label: "Start RL*",
    name: "startRL",
    type: "number",
    for: "slopeEndToEnd",
    size: 6,
  },
  {
    label: "End RL*",
    name: "endRL",
    type: "number",
    for: "slopeEndToEnd",
    size: 6,
  },
  {
    label: "Buffer*",
    name: "buffer",
    type: "number",
    for: "buffer",
    size: 6,
  },
  {
    label: "Buffer direction*",
    name: "bufferDirection",
    mode: "select",
    options: [
      { label: "Below existing level", value: "below" },
      { label: "Above existing level", value: "above" },
    ],
    for: "buffer",
    size: 6,
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
      { label: "Full width", value: "Full width" },
      { label: "Custom", value: "Custom" },
    ],
    for: "autoGenerate",
  },
  {
    label: "Length*",
    name: "length",
    mode: "select",
    options: [{ label: "All", value: "All" }],
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
        label: "Slop",
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
  startRL: "",
  endRL: "",
  slope: "",
  buffer: "",
  bufferDirection: "below",
  cSection: "",
  csSlop: "",
  csCamper: "0",
  formula: "Default",
};

const islandOptions = [
  {
    label: "CS",
    value: "cs",
    icon: <MdOutlineGridView fontSize="20px" />,
  },
  {
    label: "LS",
    value: "ls",
    icon: <MdOutlineTableRows fontSize="20px" />,
  },
  {
    label: "TEMPLATES",
    value: "templates",
    icon: <TbTemplate fontSize="20px" />,
  },
];

export default function ProposeLevel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const didMount = useRef(false);
  const { global } = useSelector((state) => state.loading);

  const [activeIsland, setActiveIsland] = useState("cs");
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
  const [inputData, setInputData] = useState(inputDetails);
  const isWaterWay = survey?.type === "Water Way";

  const schema = Yup.object().shape({
    project: Yup.string().required("Project name is required"),
    purpose: Yup.string().required("Purpose is required"),
    proposal: Yup.string().required("Proposal is required"),
    proposalMethod: isWaterWay
      ? Yup.string().required("Water Way proposal method is required")
      : Yup.string().nullable(),
    bottomWidth:
      isWaterWay && formValues.proposalMethod === "Bottom Width Fixed"
        ? Yup.number()
            .typeError("Bottom width is required")
            .required("Bottom width is required")
        : Yup.string().nullable(),
    slope:
      isWaterWay && formValues.proposalMethod === "Bottom Width Fixed"
        ? Yup.string()
            .trim()
            .matches(
              /^\d+(?:\.\d+)?\s*(?::|\/)\s*\d+(?:\.\d+)?$/,
              "Slope must be in H:V ratio format, e.g. 0.75:1",
            )
            .required("Side slope ratio is required")
        : Yup.string().nullable(),
    startRL:
      isWaterWay && formValues.proposalMethod === "Slope End-to-End Type"
        ? Yup.number()
            .typeError("Start RL is required")
            .required("Start RL is required")
        : Yup.string().nullable(),
    endRL:
      isWaterWay && formValues.proposalMethod === "Slope End-to-End Type"
        ? Yup.number()
            .typeError("End RL is required")
            .required("End RL is required")
        : Yup.string().nullable(),
    buffer:
      isWaterWay && formValues.proposalMethod === "With Respect to Buffer"
        ? Yup.number()
            .typeError("Buffer is required")
            .required("Buffer is required")
        : Yup.string().nullable(),
    bufferDirection:
      isWaterWay && formValues.proposalMethod === "With Respect to Buffer"
        ? Yup.string().required("Buffer direction is required")
        : Yup.string().nullable(),
    quantity:
      (entryType === "autoGenerate" && !isWaterWay) ||
      (isWaterWay && formValues.proposalMethod === "Bottom Width Fixed")
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
    cSection:
      crossSection === "slop" && !isWaterWay
        ? Yup.number()
            .typeError("Cross section slop is required")
            .required("Cross section slop is required")
        : Yup.string().nullable(),
    csSlop:
      crossSection === "slop" && !isWaterWay
        ? Yup.number()
            .typeError("Cross section slop is required")
            .required("Cross section slop is required")
        : Yup.string().nullable(),
    csCamper:
      crossSection === "camper" && !isWaterWay
        ? Yup.string().required("Cross section camper is required")
        : Yup.string().nullable(),
    formula: Yup.string().nullable(),
  });

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

        if (input.name === "entryType" || input.name === "crossSectionType") {
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
                ? formValues.proposalMethod !== "Bottom Width Fixed"
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
          return {
            ...input,
            hidden:
              !isWaterWaySurvey ||
              formValues.proposalMethod !== "Bottom Width Fixed",
          };
        }

        if (input.for === "slopeEndToEnd") {
          return {
            ...input,
            hidden:
              !isWaterWaySurvey ||
              formValues.proposalMethod !== "Slope End-to-End Type",
          };
        }

        if (input.for === "buffer") {
          return {
            ...input,
            hidden:
              !isWaterWaySurvey ||
              formValues.proposalMethod !== "With Respect to Buffer",
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
      const purpose =
        completedPurposes?.length ? completedPurposes?.at(-1) : "Initial Level";

      setFormValues((prev) => ({
        ...prev,
        project: surveyDoc?.project || "",
        purpose,
      }));
      setSurvey(surveyDoc);
      updateInputData(completedPurposes, surveyDoc?.type);

      const selected = surveyDoc?.purposes?.find((p) => p.type === purpose);
      const items =
        selected?.rows
          ?.filter((r) => r.type === "Chainage" || r.type === "Water Level")
          ?.map((s) => ({
            label: s.chainage,
            value: s.chainage,
          })) || [];
      setSelectableItems(items);
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

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

      const generatePurpose = isWaterWay
        ? generateWaterWayProposalPurpose
        : generateSurveyPurpose;
      const { data } = await generatePurpose(id, {
        ...formValues,
        interpolation: rows,
      });

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
  }, [crossSection, entryType, formValues.proposalMethod, survey?.type]);

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: { xs: 12, md: 14 } }}>
      <SmallHeader />

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
              onClick={() => navigate(-1)}
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
                Propose Level
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

          <Stack width={"100% !important"} spacing={4} className="input-wrapper">
            <Grid container spacing={3} columns={12} alignItems={"end"}>
              {inputData.map(
                ({ hidden, mode, size, ...input }, index) =>
                  !hidden && (
                    <Grid
                      size={{
                        xs: size || 12,
                      }}
                      key={index}
                    >
                      {(input.name === "purpose" || input.name === "cSection") && (
                        <Typography
                          variant="body2"
                          fontSize={"16px"}
                          fontWeight={600}
                          color="black"
                        >
                          {input.name === "purpose"
                            ? "Proposal Between"
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

          <Stack width={"100%"} gap={2} pt={3}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: "100%" }}
            >
              <BasicButton
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
          bottom: { xs: 24, md: 32 },
          left: "50%",
          zIndex: 1000,
          width: "max-content",
          maxWidth: "90vw",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: "8px",
            borderRadius: "24px",
            display: "inline-flex",
            alignItems: "center",
            gap: { xs: 1, md: 1.5 },
            background: "rgba(99, 102, 241, 0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.2)",
            height: { xs: "50px", md: "60px" },
            maxWidth: "stretch",
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {islandOptions.map((option) => (
            <Box
              key={option.value}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 2, md: 6 },
                height: "100%",
                borderRadius: "16px",
                cursor: "pointer",
                minWidth: "70px",
                whiteSpace: "nowrap",
                flexShrink: 0,
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
                    borderRadius: "16px",
                    zIndex: 0,
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                  }}
                />
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  gap: 1,
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
                  fontWeight={900}
                  letterSpacing="0.05em"
                  sx={{
                    lineHeight: 1,
                    position: "relative",
                    zIndex: 1,
                    color: "inherit",
                    fontSize: { xs: "0.8rem", md: "1rem" },
                    transition: "color 0.3s ease",
                  }}
                >
                  {option.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}
