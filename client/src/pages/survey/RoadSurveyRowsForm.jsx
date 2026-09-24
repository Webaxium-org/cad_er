import * as Yup from "yup";
import Plot from "react-plotly.js";
import { Activity, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import {
  Box,
  Stack,
  Typography,
  Grid,
  Tooltip,
  Paper,
  Container,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import BasicButtons from "../../components/BasicButton";
import { IoAdd } from "react-icons/io5";
import { IoIosAddCircleOutline, IoIosArrowForward } from "react-icons/io";
import { IoIosRemove } from "react-icons/io";
import BasicCheckbox from "../../components/BasicCheckbox";
import { showAlert } from "../../redux/alertSlice";
import { MdArrowBackIosNew } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { AiFillDelete } from "react-icons/ai";
import {
  createSurveyRow,
  deleteSurveyRow,
  endSurveyPurpose,
  getSurveyPurpose,
  pauseSurveyPurpose,
} from "../../services/surveyServices";
import { PiLinkSimpleBreakBold } from "react-icons/pi";
import { IoGitBranchOutline } from "react-icons/io5";
import { AiOutlinePauseCircle } from "react-icons/ai";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import BasicInput from "../../components/BasicInput";
import { getLastRlAndHi, v2ChartOptions } from "../../constants";
import { MdDone } from "react-icons/md";
import BasicSpeedDial from "../../components/BasicSpeedDial";
import BasicSelect from "../../components/BasicSelect";
import BasicCard from "../../components/BasicCard";
import BasicDivider from "../../components/BasicDevider";
import EditPreviousReading from "./components/EditPreviousReading";
import SmallHeader from "../../components/SmallHeader";
import useHardBackLock from "../../hooks/useHardBackLock";
import AddBranch from "./components/AddBranch";
import EnterBranch from "./components/EnterBranch";
import ObservationNotes from "./components/ObservationNotes";
import AddBreak from "./components/AddBreak";
import { GiCrossroad } from "react-icons/gi";
import { PiRoadHorizonFill } from "react-icons/pi";
import { MdAddRoad } from "react-icons/md";
import { FaLocationArrow, FaWater } from "react-icons/fa";
import { GrSafariOption } from "react-icons/gr";
const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
};

const formatDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${day}-${month}-${year} ${h12}.${minutes}${ampm}`;
};

const fUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const PulseDot = () => (
  <Box
    component={motion.span}
    sx={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      bgcolor: "primary.main",
      display: "inline-block",
      mr: 1,
    }}
    animate={{
      scale: [1, 1.5, 1],
      opacity: [1, 0.5, 1],
    }}
    transition={{
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

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

const getColor = (type) => {
  if (type.includes("Initial")) return colors.Initial;
  if (type.includes("Proposed")) return colors.Proposed;
  return colors.Final;
};

const finishSurveyAlertData = {
  title: "Confirm End of Survey",
  description:
    "Ending this survey will lock all existing data and prevent any new rows from being added. Do you want to continue?",
  content: "",
  cancelButtonText: "Cancel",
  submitButtonText: "Submit",
};

const pauseSurveyAlertData = {
  title: "Pause Survey?",
  description:
    "Pausing this survey will save your current progress. You can resume later",
  content: (
    <Stack spacing={2} mt={2}>
      <BasicInput
        label="Foresight*"
        placeholder="Enter foresight"
        type="number"
        name="foreSight"
        id="inpPauseForeSight"
      />

      <BasicInput
        label="Remark*"
        placeholder="Enter remark"
        type="text"
        name="inpPauseRemark"
        id="inpPauseRemark"
      />
    </Stack>
  ),
  cancelButtonText: "Cancel",
  submitButtonText: "Pause",
};

const initialFormValues = {
  type: "Chainage",
  chainage: "",
  basis: "Readings",
  roadWidth: "",
  spacing: "",
  intermediateOffsets: [
    { intermediateSight: "", offset: "", remark: "", mode: "R" },
  ],
  intermediateSight: "",
  foreSight: "",
  backSight: "",
  remark: "",
  observation: "",
};

const values = {
  Chainage: ["chainage", "basis", "roadWidth", "spacing", "intermediateOffsets"],
  "Water Level": ["intermediateSight", "remark"],
  CP: ["foreSight", "backSight", "remark"],
  TBM: ["intermediateSight", "remark"],
};

const inputDetails = [
  { label: "Chainage*", name: "chainage", placeholder: "0/000", type: "text" },
  {
    label: "Basis*",
    name: "basis",
    type: "select",
    options: ["Readings", "Soundings"],
  },
  { label: "Width*", name: "roadWidth", type: "number", size: 6 },
  { label: "Spacing*", name: "spacing", type: "number", size: 6 },
  { label: "Fore sight*", name: "foreSight", type: "number", size: 6 },
  { label: "Back sight*", name: "backSight", type: "number", size: 6 },
  { label: "Remark*", name: "remark", type: "text" },
];

const RoadSurveyRowsForm = () => {
  useHardBackLock(true);

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const didMount = useRef(false);
  const { global } = useSelector((state) => state.loading);

  const [purpose, setPurpose] = useState(null);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState({});
  const [formWarnings, setFormWarnings] = useState({});
  const [inputData, setInputData] = useState([]);
  const [rowType, setRowType] = useState("Chainage");
  const [page, setPage] = useState(0);
  const [btnLoading, setBtnLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLastProposalReading, setIsLastProposalReading] = useState(false); // only for proposal's
  const [chartOptions, setChartOptions] = useState(null);
  const [selectedCs, setSelectedCs] = useState(null);
  const [alertData, setAlertData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [openAddBranch, setOpenAddBranch] = useState(false);
  const [openAddBreak, setOpenAddBreak] = useState(false);
  const [openEnterBranch, setOpenEnterBranch] = useState(false);
  const [upcomingBranches, setUpcomingBranches] = useState([]);
  const graphRef = useRef(null);
  const [graphHeight, setGraphHeight] = useState(0);
  const [keyboardViewportTop, setKeyboardViewportTop] = useState(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    let fullHeight = viewport.height;
    const updateKeyboardPosition = () => {
      const focused = document.activeElement;
      const isEditing = focused?.matches?.("input, textarea, [contenteditable='true']");
      if (!isEditing) fullHeight = Math.max(fullHeight, viewport.height);
      setKeyboardViewportTop(
        isEditing && fullHeight - viewport.height > 120 ? viewport.offsetTop : null,
      );
    };

    viewport.addEventListener("resize", updateKeyboardPosition);
    viewport.addEventListener("scroll", updateKeyboardPosition);
    document.addEventListener("focusin", updateKeyboardPosition);
    document.addEventListener("focusout", updateKeyboardPosition);
    return () => {
      viewport.removeEventListener("resize", updateKeyboardPosition);
      viewport.removeEventListener("scroll", updateKeyboardPosition);
      document.removeEventListener("focusin", updateKeyboardPosition);
      document.removeEventListener("focusout", updateKeyboardPosition);
    };
  }, []);

  useEffect(() => {
    if (!graphRef.current || !window.ResizeObserver) return undefined;
    const observer = new ResizeObserver(([entry]) => setGraphHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height));
    observer.observe(graphRef.current);
    return () => observer.disconnect();
  }, [page, rowType, selectedCs]);

  const isWaterWay = purpose?.surveyId?.type === "Water Way";
  const isRoadSurvey = purpose?.surveyId?.type === "Road Survey";
  const showBasis = rowType === "Chainage" && !isRoadSurvey;
  const waterLevelLocked = rowType === "Water Level" && !!formValues.intermediateSight;

  const schema = Yup.object().shape({
    type: Yup.string().required("Type is required"),

    chainage: Yup.string().when("type", {
      is: "Chainage",
      then: (schema) =>
          schema
            .required("Chainage is required")
            .matches(
              /^\d+(\/|\+|,)\d+(\.\d{1,3})?$/,
              "Invalid chainage format. Use ####/###.### or '####+###.###' or '####,###.###'",
            ),
      otherwise: (schema) => schema.nullable(),
    }),

    basis: Yup.string().when("type", {
      is: "Chainage",
      then: (schema) => schema.required("Basis is required"),
      otherwise: (schema) => schema.nullable(),
    }),

    roadWidth: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value,
      )
      .when("type", {
        is: "Chainage",
        then: (schema) =>
          schema
            .typeError(
              isWaterWay
                ? "Water way width is required"
                : "Width is required",
            )
            .required(
              isWaterWay
                ? "Water way width is required"
                : "Width is required",
            ),
        otherwise: (schema) => schema.nullable(),
      }),

    spacing: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value,
      )
      .when("type", {
        is: "Chainage",
        then: (schema) =>
          schema
            .typeError("Spacing is required")
            .required("Spacing is required"),
        otherwise: (schema) => schema.nullable(),
      }),

    intermediateOffsets: Yup.array()
      .of(
        Yup.object().shape({
          reducedLevel:
            purpose?.phase !== "Proposal"
              ? Yup.number()
                  .transform((v, o) => (o === "" ? null : v))
                  .nullable()
              : Yup.number()
                  .transform((v, o) => (o === "" ? null : v))
                  .nullable()
                  .typeError("Reduced level is required")
                  .required("Reduced level is required"),
          intermediateSight:
            purpose?.phase === "Proposal"
              ? Yup.number()
                  .transform((v, o) => (o === "" ? null : v))
                  .nullable()
              : Yup.number()
                  .transform((v, o) => (o === "" ? null : v))
                  .nullable()
                  .typeError("Intermediate sight is required")
                  .required("Intermediate sight is required"),
          offset: Yup.number()
            .transform((v, o) => (o === "" ? null : v))
            .nullable()
            .typeError("Offset is required")
            .required("Offset is required"),
          remark: Yup.string().required("Remark is required"),
        }),
      )
      .when("type", {
        is: "Chainage",
        then: (schema) =>
          schema
            .min(1, "At least one row is required")
            .required("Offsets are required"),
        otherwise: (schema) => schema.transform(() => null).nullable(),
      }),

    foreSight: Yup.number()
      .transform((v, o) => (o === "" ? null : v))
      .when("type", {
        is: "CP",
        then: (schema) =>
          schema
            .typeError("Fore sight is required")
            .required("Fore sight is required"),
        otherwise: (schema) => schema.nullable(),
      }),

    intermediateSight: Yup.number()
      .transform((v, o) => (o === "" ? null : v))
      .when("type", {
        is: (val) => ["TBM", "Water Level"].includes(val),
        then: (schema) =>
          schema
            .typeError("Intermediate sight is required")
            .required("Intermediate sight is required"),
        otherwise: (schema) => schema.nullable(),
      }),

    backSight: Yup.number()
      .transform((v, o) => (o === "" ? null : v))
      .when("type", {
        is: "CP",
        then: (schema) =>
          schema
            .typeError("Back sight is required")
            .required("Back sight is required"),
        otherwise: (schema) => schema.nullable(),
      }),

    remark: Yup.string()
      .trim()
      .when("type", {
        is: (val) => ["CP", "TBM", "Water Level"].includes(val),
        then: (schema) => schema.required("Remark is required"),
        otherwise: (schema) => schema.nullable(),
      }),
  });

  const handleCalculateFinalForesight = (e) => {
    const inpFinalForesight = document.getElementById("finalForesight");
    const inpPLS = document.getElementById("pls");

    const lastReading = purpose.rows.at(-1);

    const reducedLevel = purpose.surveyId?.reducedLevel || 0;

    const value = Number(lastReading.heightOfInstrument) - Number(reducedLevel);

    inpFinalForesight.value = e.target.checked ? value.toFixed(3) : "";
    inpPLS.value = e.target.checked ? "0.000" : "";
  };

  const handleOpenAddBranch = () => {
    setOpenAddBranch(true);
  };

  const handleCloseAddBranch = () => {
    setOpenAddBranch(false);
  };

  const handleOpenAddBreak = () => {
    setOpenAddBreak(true);
  };

  const handleCloseAddBreak = () => {
    setOpenAddBreak(false);
  };

  const handleOpenEnterBranch = () => {
    if (!upcomingBranches?.length) {
      return dispatch(
        showAlert({
          type: "error",
          message: "You can't enter a branch if there is no upcoming branch",
        }),
      );
    }

    setOpenEnterBranch(true);
  };

  const handleCloseEnterBranch = () => {
    setOpenEnterBranch(false);
  };

  const speedDialActions = [
    {
      icon: <IoGitBranchOutline />,
      name: "BRANCH",
      onClick: () => handleOpenAddBranch(),
      show: purpose && purpose?.type === "Initial Level",
    },
    {
      icon: <IoGitBranchOutline />,
      name: "BRANCH",
      onClick: () => handleOpenEnterBranch(),
      show: purpose && purpose?.type !== "Initial Level",
    },
    {
      icon: <PiLinkSimpleBreakBold />,
      name: "BREAK",
      onClick: () => handleOpenAddBreak(),
      show: true,
    },
    {
      icon: <AiOutlinePauseCircle />,
      name: "PAUSE",
      onClick: () => handleClickOpen("Pause Survey"),
      show:
        purpose &&
        purpose?.phase === "Actual" &&
        purpose?.status !== "Paused" &&
        page === 0,
    },
    {
      icon: <MdDone />,
      name: "WRAP",
      onClick: () => handleClickOpen("Finish Survey"),
      show: purpose && page === 0,
    },
  ];

  const handleClickOpen = (action) => {
    if (
      action === "Finish Survey" &&
      (formValues.foreSight.trim() || formValues.backSight.trim())
    ) {
      dispatch(
        showAlert({
          type: "error",
          message:
            'If you are trying to add a Change Point (CP), please click "Continue" first, then finish the survey. Otherwise, clear the input fields before proceeding.',
        }),
      );

      setOpen(false);
    } else {
      let updatedAlertData = null;

      if (action === "Finish Survey") {
        updatedAlertData = {
          ...finishSurveyAlertData,
          onSubmit: handleEndSurveyPurpose,
          content: purpose?.phase === "Actual" && (
            <Box mt={2}>
              <Stack direction={"row"} alignItems={"center"}>
                <Typography fontSize={"16px"} fontWeight={600} color="black">
                  Auto calculate
                </Typography>
                <BasicCheckbox
                  id="autoCalculate"
                  onChange={(e) => handleCalculateFinalForesight(e)}
                />
              </Stack>
              <BasicInput
                label="Final foresight*"
                placeholder="Enter foresight"
                type="number"
                name="finalForesight"
                id="finalForesight"
              />

              <Box mt={2}>
                <BasicInput
                  label="PLS*"
                  placeholder="Enter pls"
                  type="number"
                  name="pls"
                  id="pls"
                />
              </Box>
            </Box>
          ),
        };
      } else {
        updatedAlertData = {
          ...pauseSurveyAlertData,
          onSubmit: handlePauseSurvey,
        };
      }

      setAlertData(updatedAlertData);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpenEdit = () => {
    setIsEdit(true);
  };

  const handleClickCloseEdit = () => {
    setIsEdit(false);
  };

  const handleDeletePrevReading = async () => {
    try {
      if (purpose?.rows?.length === 1) {
        return dispatch(
          showAlert({
            type: "error",
            message: "You can't delete the first reading",
          }),
        );
      }

      const prevReading = purpose?.rows?.at(-1);

      const rowId = prevReading?._id;

      const { data } = await deleteSurveyRow(id, rowId);

      if (data.success) {
        const purposeDoc = {
          ...purpose,
          rows: purpose?.rows?.filter((r) => String(r._id) !== String(rowId)),
        };

        setFormValues({
          ...initialFormValues,
          intermediateOffsets: [
            { intermediateSight: "", offset: "", remark: "", mode: "R" },
          ],
        });

        getNewChainage(purposeDoc);

        setPurpose(purposeDoc);

        dispatch(
          showAlert({
            type: "success",
            message: `${prevReading.type} deleted successfully`,
          }),
        );
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const updateInputData = () => {
    const isWaterWay = purpose?.surveyId?.type === "Water Way";
    const isRoadSurvey = purpose?.surveyId?.type === "Road Survey";
    const filteredInputData = inputDetails
      ?.map((d) => {
        let label = d.label;
        if (isWaterWay && rowType === "Water Level" && d.name === "roadWidth") {
          label = "Water way width*";
        }
        if (rowType === "CP" && d.name === "backSight") {
          return {
            ...d,
            label,
            disabled: purpose?.status !== "Paused",
          };
        }

        return { ...d, label };
      })
      ?.filter((d) => {
        if (d.name === "basis" && isRoadSurvey) return false;
        return values[rowType]?.includes(d.name);
      });

    if (rowType === "TBM" || rowType === "Water Level") {
      filteredInputData.unshift({
        label: "Intermediate sight*",
        name: "intermediateSight",
        type: "number",
      });
    }

    setFormValues((prev) => ({ ...prev, type: rowType }));
    setInputData(filteredInputData);
  };

  const handleChangeRowType = (type) => {
    if (type === "CP" || type === "TBM" || type === "Water Level") {
      const length = purpose?.rows?.filter((r) => r.type === type)?.length || 0;
      const remarkLabel = type === "Water Level" ? "WL" : type;
      const remarkNumber = length + (type === "TBM" && purpose.type === "Initial Level" ? 2 : 1);
      const remark = type === "Water Level"
        ? `${remarkLabel} - ${remarkNumber} (${formatDateTime()})`
        : `${remarkLabel} - ${remarkNumber}`;

      setFormValues((prev) => ({ ...prev, remark }));
    }

    setRowType(type);
  };

  const calculateOffset = () => {
    const roadWidth = Number(formValues.roadWidth || 0);
    const spacing = Number(formValues.spacing || 0);

    const intermediateOffsets = ["0.000"];

    const halfWidth = roadWidth / 2;
    let limit = Math.ceil(halfWidth / spacing);

    for (let i = 1; i <= limit; i++) {
      let value = i * spacing;

      // Cap the value at halfWidth if it exceeds it
      if (value > halfWidth) value = halfWidth;

      const negativeValue = -value;

      intermediateOffsets.push(value.toFixed(3), negativeValue.toFixed(3));

      if (i + 1 === limit && value < halfWidth) {
        limit += 1;
      }

      // Stop if we've reached or exceeded the half width
      if (value >= halfWidth) break;
    }

    const updatedRows = [...formValues.intermediateOffsets].filter(
      (o) => o.intermediateSight.length,
    );

    const defaultMode = formValues.basis === "Soundings" ? "S" : "R";

    intermediateOffsets
      ?.sort((a, b) => a - b)
      ?.forEach((entry, i) => {
        if (i >= updatedRows.length) {
          const parsedEntry = Number(entry);

          updatedRows[i] = {
            offset: entry,
            intermediateSight: "",
            remark: parsedEntry < 0 ? "LHS" : parsedEntry === 0 ? "PLS" : "RHS",
            mode: defaultMode,
          };
        } else {
          updatedRows[i].offset = entry;
          updatedRows[i].intermediateSight =
            updatedRows[i].intermediateSight || "";
          updatedRows[i].remark = updatedRows[i].remark;
          updatedRows[i].mode = updatedRows[i].mode || defaultMode;
        }
      });

    setFormValues((prev) => ({ ...prev, intermediateOffsets: updatedRows }));
    handleChangeReducedLevel(updatedRows);
  };

  const handleInputChange = async (event, index, field) => {
    const { name, value } = event.target;

    if (name === "basis" && value === "Soundings") {
      const hasWaterLevel = purpose?.rows?.some((r) => r.type === "Water Level");
      if (!hasWaterLevel) {
        dispatch(
          showAlert({
            type: "error",
            message: "Add a Water Level reading first before selecting Soundings",
          }),
        );
        return;
      }
    }

    if (rowType === "CP") {
      if (name === "foreSight") {
        setInputData((prev) =>
          prev.map((p) => {
            if (p.name === "backSight") {
              return {
                ...p,
                disabled: value === "",
              };
            }

            return p;
          }),
        );
      }
    }

    const target =
      name === "intermediateOffsets"
        ? `intermediateOffsets[${index}].${field}`
        : name;

    if (name === "intermediateOffsets" || name === "intermediateSight") {
      if (value) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          const decimalPart = value.split(".")[1] || "";
          const decimalPlaces = decimalPart.length;

          if (decimalPlaces > 2 && !/[05]$/.test(decimalPart)) {
            setFormWarnings({
              ...formWarnings,
              [target]: "Floating values least count error",
            });
          } else {
            setFormWarnings({ ...formWarnings, [target]: null });
          }
        }
      }
    }

    if (name === "intermediateOffsets") {
      const updated = [...formValues.intermediateOffsets];
      updated[index][field] = value;

      setFormValues((prev) => ({
        ...prev,
        intermediateOffsets: updated,
      }));

      handleChangeReducedLevel(updated);
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    try {
      await Yup.reach(schema, name).validate(value);

      setFormErrors({ ...formErrors, [target]: null });
    } catch (error) {
      setFormErrors({ ...formErrors, [target]: error.message });
    }
  };

  const handleAddRow = () => {
    const defaultMode = formValues.basis === "Soundings" ? "S" : "R";
    setFormValues((prev) => ({
      ...prev,
      intermediateOffsets: [
        ...(formValues.intermediateOffsets || []),
        { intermediateSight: "", offset: "", remark: "", mode: defaultMode },
      ],
    }));

    setInputData([...inputData]);
  };

  const handleRemoveRow = (index) => {
    if (formValues.intermediateOffsets.length > 1) {
      setFormValues((prev) => ({
        ...prev,
        intermediateOffsets: formValues.intermediateOffsets.filter(
          (_, idx) => idx !== index,
        ),
      }));
    }
  };

  const getNewChainage = (purpose) => {
    try {
      const isProposal = purpose.phase === "Proposal";

      if (isProposal) {
        let currentReading = null;
        const initialSurvey = purpose?.surveyId?.purposes?.find(
          (p) => p.type === "Initial Level",
        );
        if (purpose?.rows?.length) {
          const prevChainage = purpose?.rows?.at(-1)?.chainage;

          const filteredInitialSurvey =
            initialSurvey?.rows?.filter(
              (r) => r.type === "Chainage",
            ) ?? [];

          const currentIndex = filteredInitialSurvey.findIndex(
            (r) => r.chainage === prevChainage,
          );

          if (currentIndex === -1) {
            throw new Error("Previous chainage not found in initial survey");
          }

          const nextReading = filteredInitialSurvey[currentIndex + 1] || null;
          const isLastReading =
            currentIndex + 1 >= filteredInitialSurvey.length - 1;

          if (isLastReading) setIsLastProposalReading(true);

          if (!nextReading) {
            throw new Error("Next chainage not found, returning to dashboard");
          }

          currentReading = nextReading;
        } else {
          currentReading = initialSurvey?.rows?.find(
            (r) => r.type === "Chainage",
          );
        }

        if (currentReading) {
          const updatedValues = {
            chainage: currentReading?.chainage || "",
            roadWidth: currentReading?.roadWidth || "",
            spacing: currentReading?.spacing || "",
            basis: currentReading?.basis || "Readings",
          };

          setFormValues((prev) => ({
            ...prev,
            ...updatedValues,
          }));
        }
      } else {
        const isFirstChainage = purpose?.rows?.find(
          (r) =>
            r.type === "Chainage" ||
            r.type === "Break",
        );

        if (!isFirstChainage) {
          setFormValues((prev) => ({
            ...prev,
            chainage: `0${purpose?.surveyId?.separator || "/"}000`,
          }));
        } else {
          const lastChainage = purpose?.rows
            ?.filter(
              (r) =>
                r.type === "Chainage" ||
                r.type === "Break",
            )
            ?.at(-1);

          const lastChainageDigit =
            lastChainage.type === "Chainage" ? lastChainage.chainage : lastChainage.to;

          const chainageMultiple = purpose?.surveyId?.chainageMultiple;
          const lastDigit = Number(
            lastChainageDigit.split(purpose?.surveyId?.separator || "/")[1],
          );

          const remainder = lastDigit % chainageMultiple;
          const nextNumber =
            remainder === 0
              ? lastDigit + chainageMultiple
              : lastDigit + (chainageMultiple - remainder);

          const nextChainage = `0${purpose?.surveyId?.separator || "/"}${String(
            nextNumber,
          ).padStart(3, "0")}`;

          setFormValues((prev) => ({
            ...prev,
            chainage: nextChainage,
            roadWidth: Number(lastChainage?.roadWidth) || "",
            spacing: lastChainage?.spacing || "",
            basis: lastChainage?.basis || "Readings",
          }));
        }
      }
    } catch (error) {
      navigate("/");

      handleFormError(error, null, dispatch, navigate);
    }
  };

  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      if (rowType === "Chainage" && page === 0) {
        const pickItems = ["chainage", "roadWidth", "spacing"];

        const isProposal = purpose.phase === "Proposal";

        const partialSchema = schema.pick(pickItems);
        await partialSchema.validate(formValues, { abortEarly: false });

        if (formValues.intermediateOffsets?.length === 1) {
          if (isProposal) {
            setFormValues((prev) => ({
              ...prev,
              intermediateOffsets: [
                {
                  reducedLevel: "",
                  offset: "",
                  remark: "",
                },
                {
                  reducedLevel: "",
                  offset: "",
                  remark: "",
                },
                {
                  reducedLevel: "",
                  offset: "",
                  remark: "",
                },
              ],
            }));
          } else {
            setFormValues((prev) => ({
              ...prev,
              intermediateOffsets: [
                ...prev.intermediateOffsets,
                {
                  intermediateSight: "",
                  offset: "",
                  remark: "",
                },
                { intermediateSight: "", offset: "", remark: "" },
              ],
            }));
          }
        }

        calculateOffset();
        setBtnLoading(false);
        return setPage(1);
      }

      await schema.validate(formValues, { abortEarly: false });

      let payload = null;

      if (rowType === "Chainage") {
        const sortedOffsets = [...(formValues.intermediateOffsets || [])].sort(
          (a, b) => Number(a.offset) - Number(b.offset),
        );

        payload = {
          ...formValues,
          intermediateOffsets: sortedOffsets.map((r) => ({
            is:
              purpose.phase === "Proposal"
                ? ""
                : String(r.intermediateSight || ""),
            rl:
              purpose.phase === "Proposal" ? String(r.reducedLevel || "") : "",
            offset: String(r.offset || ""),
            remark: String(r.remark || ""),
            mode: r.mode || "S",
          })),
        };
      } else {
        payload = { ...formValues, chainage: null };
      }

      const { data } = await createSurveyRow(id, payload);

      if (data.success) {
        if (isLastProposalReading) {
          navigate("/survey");
          return;
        }

        const purposeDoc = data.purpose;

        setFormValues({
          ...initialFormValues,
          intermediateOffsets: [
            { intermediateSight: "", offset: "", remark: "", mode: "R" },
          ],
          remark:
            rowType === "CP"
              ? `${rowType} - ${purposeDoc.rows.filter((r) => r.type === rowType)?.length + 1}`
              : "",
        });

        getNewChainage(purposeDoc);

        if (rowType === "Chainage") {
          setPage(0);
        }

        if (
          (purpose.type === "Initial Level" && rowType === "TBM") ||
          purpose.status === "Paused"
        ) {
          setRowType(
            purpose?.surveyId?.type === "Water Way"
              ? "Water Level"
              : "Chainage",
          );
        } else if (rowType === "Water Level") {
          setRowType("Chainage");
          dispatch(
            showAlert({
              type: "success",
              message: `Water Level added at ${formatDateTime()}`,
              duration: 3000,
            }),
          );
        }

        setPurpose(purposeDoc);
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setFormWarnings({});
      setBtnLoading(false);
    }
  };

  const handleEndSurveyPurpose = async () => {
    try {
      let finalForesight = null;
      let pls = null;

      const inpFinalForesight = document.getElementById("finalForesight");
      const inpPLS = document.getElementById("pls");
      const inpAutoCalculate = document.getElementById("autoCalculate");

      if (purpose.phase === "Actual") {
        if (!inpFinalForesight?.value?.trim()) {
          inpFinalForesight.parentElement.parentElement.classList.add(
            "inp-err",
          );

          return;
        } else {
          inpFinalForesight.parentElement.parentElement.classList.remove(
            "inp-err",
          );

          finalForesight = inpFinalForesight.value;
        }

        if (!inpPLS?.value?.trim()) {
          inpPLS.parentElement.parentElement.classList.add("inp-err");

          return;
        } else {
          inpPLS.parentElement.parentElement.classList.remove("inp-err");

          pls = inpPLS.value;
        }
      }

      const { data } = await endSurveyPurpose(id, finalForesight, pls);

      if (data.success) {
        handleClose();

        inpFinalForesight.value = "";
        inpPLS.value = "";
        inpAutoCalculate.checked = false;

        dispatch(
          showAlert({
            type: "success",
            message: `${purpose.type} Finished`,
          }),
        );

        const surveyDoc = purpose?.surveyId;

        const isBranch = surveyDoc?.branchDetails?.isBranch;
        if (isBranch) {
          const parentBranch = data.parentBranch;

          const activePurpose = parentBranch?.purposes?.find(
            (p) => !p.isPurposeFinish,
          );

          if (activePurpose) {
            navigate(`/survey/road-survey/${activePurpose?._id}/rows`);
            return;
          } else {
            throw Error("Something went wrong");
          }
        }

        const link =
          purpose.type === "Initial Level"
            ? `/survey/road-survey/${purpose._id}/field-book`
            : "/survey";

        navigate(link);
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (error) {
      handleFormError(error, setFormErrors, dispatch, navigate);
    } finally {
      setBtnLoading(false);
    }
  };

  const handlePauseSurvey = async () => {
    try {
      const inputsToMap = {
        inpPauseForeSight: "",
        inpPauseRemark: "",
      };

      for (const i in inputsToMap) {
        const inp = document.getElementById(i);

        inputsToMap[i] = inp.value;

        if (!inp?.value?.trim()) {
          inp.parentElement.parentElement.classList.add("inp-err");
          return;
        } else {
          inp.parentElement.parentElement.classList.remove("inp-err");
        }
      }

      const { data } = await pauseSurveyPurpose(
        id,
        inputsToMap.inpPauseForeSight,
        inputsToMap.inpPauseRemark,
      );

      if (data.success) {
        dispatch(
          showAlert({
            type: "success",
            message: `${purpose.type} Paused`,
          }),
        );

        navigate("/survey");
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const handleChangeReducedLevel = (values) => {
    if (!selectedCs?.series?.[0]?.data) return;

    let reducedLevels = null;

    if (purpose.phase === "Actual") {
      const newReading = {
        type: rowType,
        intermediateOffsets: values.map((v) => ({
          is: v.intermediateSight || "",
          rl: v.reducedLevel || "",
          offset: v.offset || "",
          remark: v.remark || "",
          mode: v.mode || "S",
        })),
      };
      const calculatedData = getLastRlAndHi(
        purpose.surveyId,
        newReading,
        purpose._id,
      );

      reducedLevels = calculatedData.rl;
    } else {
      reducedLevels = values.map((v) => v.reducedLevel);
    }

    // Create deep copies of what you mutate
    const newSeries = selectedCs.series.map((s, i) => {
      if (s.name === purpose.type) {
        const updatedData = values
          ?.map((v, idx) => ({
            x: Number(v.offset),
            y: Number(reducedLevels[idx] || 0),
          }))
          .sort((a, b) => a.x - b.x);

        return { ...s, data: updatedData };
      }

      return s;
    });

    const filteredReducedLevels = reducedLevels.filter(
      (lv) => lv !== null && lv !== undefined,
    );

    let minY = Math.min(...filteredReducedLevels);
    let maxY = Math.max(...filteredReducedLevels);

    setSelectedCs((prev) => {
      const prevMinY = prev.minY;
      const prevMaxY = prev.maxY;

      minY = Number.isNaN(prevMinY) ? minY : Math.min(minY, prevMinY);
      maxY = Number.isNaN(prevMaxY) ? maxY : Math.max(maxY, prevMaxY);

      return {
        ...prev,
        minY,
        maxY,
        offsets: values.map((v) => Number(v.offset)).sort((a, b) => a - b),
        series: newSeries,
        // change id to force Chart remount
        id: `${selectedCs.id}-r${Date.now()}`,
      };
    });

    const pad = (maxY - minY) * 0.1;

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
      },
    }));
  };

  const makeSeries = (offsets, levels) =>
    offsets.map((o, i) => ({
      x: Number(Number(o).toFixed(3)), // NUMERIC X (IMPORTANT)
      y: Number(Number(levels?.[i] ?? 0).toFixed(3)),
    }));

  const handleChangeCompare = (value) => {
    const findPurpose = purpose.surveyId?.purposes?.find(
      (p) => p.type === value,
    );

    const newRow = findPurpose?.rows?.find(
      (r) => r.chainage === formValues.chainage,
    );

    const safeProposal = (newRow?.intermediateOffsets || []).map((e) => e.rl);

    const newData = {
      name: findPurpose.type,
      color: getColor(findPurpose.type),
      data: makeSeries(
        (newRow?.intermediateOffsets || []).map((e) => e.offset),
        safeProposal,
      ),
    };

    let minY = Math.min(...safeProposal);
    let maxY = Math.max(...safeProposal);

    setSelectedCs((prev) => {
      const prevMinY = prev.minY;
      const prevMaxY = prev.maxY;

      minY = Number.isNaN(prevMinY) ? minY : Math.min(minY, prevMinY);
      maxY = Number.isNaN(prevMaxY) ? maxY : Math.max(maxY, prevMaxY);

      return {
        ...prev,
        minY,
        maxY,
        series: [prev.series[0], newData],
      };
    });

    const pad = (maxY - minY) * 0.1;

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
      },
    }));

    setCompareData(findPurpose);
  };

  useEffect(() => {
    if (didMount.current) {
      updateInputData();
    } else {
      didMount.current = true;
    }
  }, [rowType, purpose]);

  useEffect(() => {
    if (page === 1 && compareData) {
      handleChangeCompare(compareData.type);
    }
  }, [page]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!global) dispatch(startLoading());

        const { data } = await getSurveyPurpose(id);

        const surveyDoc = data.purpose?.surveyId;

        const isBranchActive =
          surveyDoc?.branchDetails?.hasBranching &&
          !surveyDoc?.branchDetails?.isBranchEnd;

        // If the main survey have branching
        if (isBranchActive) {
          const branchDoc = surveyDoc?.branchDetails?.currentBranch;
          const activePurpose = branchDoc?.purposes?.find(
            (p) => !p.isPurposeFinish,
          );

          if (activePurpose) {
            navigate(`/survey/road-survey/${activePurpose?._id}/rows`);
            return;
          }
          //  else {
          //   throw Error("Something went wrong");
          // }
        }

        const purposeDoc = data.purpose;

        if (surveyDoc?.parentBranch?.length) {
          setUpcomingBranches(
            surveyDoc?.parentBranch?.filter(
              (p) => !p?.finishedLevels?.includes(purposeDoc?.type),
            ),
          );
        }

        // for live graph
        setSelectedCs({
          id,
          datum: 0,
          offsets: [0, 0, 0],
          chainage: formValues.chainage,
          series: [
            {
              name: purposeDoc.type,
              color: getColor(purposeDoc.type),
              data: [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 },
              ],
            },
          ],
        });

        if (purposeDoc?.isPurposeFinish) {
          navigate("/survey");
          throw Error(`${data?.purpose?.type} already completed`);
        }

        if (purposeDoc.status === "Paused") {
          const lastRow = purposeDoc.rows[purposeDoc.rows.length - 1];

          setFormValues((prev) => ({
            ...prev,
            foreSight: lastRow.foreSight,
            remark: lastRow.remark || lastRow.remarks?.[0] || "",
          }));
          setRowType("CP");
        } else {
          getNewChainage(purposeDoc);
        }

        setPurpose(purposeDoc);
      } catch (error) {
        handleFormError(error, null, dispatch, navigate);
      } finally {
        dispatch(stopLoading());
      }
    };
    fetchData();
  }, [id, location.state]);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: { xs: 8, md: 12 } }}>
      <SmallHeader />

      {/* Internal Modals */}
      <AlertDialogSlide {...alertData} open={open} onCancel={handleClose} />

      <AddBranch
        open={openAddBranch}
        handleClose={handleCloseAddBranch}
        surveyId={purpose?.surveyId?._id}
        purposeId={purpose?._id}
      />

      <EnterBranch
        phase={purpose?.phase}
        open={openEnterBranch}
        handleClose={handleCloseEnterBranch}
        surveyId={purpose?.surveyId?._id}
        purposeId={purpose?._id}
        branches={upcomingBranches}
      />

      <AddBreak
        open={openAddBreak}
        handleClose={handleCloseAddBreak}
        purposeId={purpose?._id}
        chainage={formValues.chainage}
      />

      {/* Main Form Layout Container */}
      <Container maxWidth="md">
        {rowType === "Chainage" &&
          page === 1 &&
          selectedCs &&
          selectedCs?.series && (
            <Box sx={{ display: keyboardViewportTop !== null ? "block" : "contents", height: keyboardViewportTop !== null ? graphHeight : "auto" }}>
            <Box
              ref={graphRef}
              position={keyboardViewportTop !== null ? "fixed" : "sticky"}
              top={keyboardViewportTop !== null ? `${keyboardViewportTop}px` : "68px"}
              bgcolor={"white"}
              zIndex={keyboardViewportTop !== null ? 1101 : 2}
              sx={{
                ...(keyboardViewportTop !== null && {
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "calc(100% - 32px)",
                  maxWidth: "852px",
                }),
                p: "8px",
                borderRadius: "0px 0px 20px 20px",
                gap: { xs: 1, md: 2 },
                bgcolor: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                maxWidth: "100%",
                overflowX: "auto",
                "& .svg-container svg": {
                  borderRadius: "20px",
                  backgroundColor: "transparent !important",
                },
              }}
            >
              <Box display={"flex"} justifyContent={"end"} pr={2}>
                <motion.div variants={fUp}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      px: 2,
                      py: 0.5,
                      mb: 3,
                      borderRadius: 10,
                      bgcolor: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      width={"max-content"}
                    >
                      <PulseDot />
                      <Typography
                        variant="caption"
                        sx={{
                          // Change: Pure white or very light indigo for readability
                          color: "primary.main",
                          fontWeight: 700,
                          letterSpacing: 1,
                        }}
                      >
                        live
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Box>

              <Activity
                mode={purpose.type === "Initial Level" ? "hidden" : "visible"}
              >
                <Box display={"flex"} justifyContent={"end"}>
                  <BasicSelect
                    label="Compare"
                    options={purpose.surveyId?.purposes
                      ?.filter((p) => p.type !== purpose.type)
                      .map((p) => ({ label: p.type, value: p.type }))}
                    value={compareData?.type || ""}
                    onChange={(e) => handleChangeCompare(e.target.value)}
                    sx={{
                      width: "62px",
                      "& .MuiOutlinedInput-root": { padding: "4px 14px" },
                    }}
                  />
                </Box>
              </Activity>

              <Plot
                data={selectedCs?.series?.map((s) => ({
                  x: s?.data?.map((p) => p.x),
                  y: s?.data?.map((p) => p.y),
                  type: "scatter",
                  mode: "lines",
                  name: s.name,
                  line: { shape: "linear", width: 2, color: s.color },
                }))}
                config={chartOptions.config}
                layout={chartOptions.layout}
                style={{ width: "100%", height: 100 }}
              />
            </Box>
            </Box>
          )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: "28px",
            bgcolor: "#ffffff",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            position: "relative",
            mt: 2,
            // overflow: "hidden" removed to allow SpeedDial overflow
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
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
            }}
          />

          <Stack spacing={2} sx={{ position: "relative" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              mb={3}
              mt={1}
              spacing={2}
            >
              {page === 1 && (
                <IconButton
                  onClick={() => setPage(0)}
                  sx={{
                    bgcolor: "#f1f5f9",
                    color: "#475569",
                    borderRadius: "16px",
                    width: 48,
                    height: 48,
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
              )}
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"start"}
                width={"100%"}
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    color="#1e293b"
                    sx={{
                      letterSpacing: "-0.02em",
                      fontSize: { xs: "1.4rem", md: "1.8rem" },
                    }}
                    width={"max-content"}
                  >
                    {page === 1
                      ? "Enter Intermediate Sight"
                      : `Enter ${rowType} Details`}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                    mt={0.5}
                  >
                    {purpose?.type || "Survey"} Data Entry
                  </Typography>
                </Box>

                {page === 0 && (
                  <Stack
                    direction={"row"}
                    justifyContent={"end"}
                    width={"100%"}
                  >
                    <Box width={"40px"} zIndex={1050} position={"relative"}>
                      <BasicSpeedDial
                        actions={speedDialActions?.filter((a) => a.show)}
                        direction={"down"}
                        sx={{
                          top: 0,
                          right: 0,
                          "& button": {
                            width: "40px",
                            height: "40px",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Stack>

            <Stack width={"100%"}>
              {upcomingBranches?.length > 0 &&
                purpose?.surveyId?.parentBranch?.length > 0 && (
                  <Stack
                    width="100%"
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Tooltip
                      title={
                        <Typography fontSize={12}>
                          🚧 Upcoming Branch -{" "}
                          {purpose?.surveyId?.parentBranch[0]?.name} @{" "}
                          {
                            purpose?.surveyId?.parentBranch[0]
                              ?.branchStartedFrom
                          }
                        </Typography>
                      }
                      arrow
                      placement="top"
                      enterTouchDelay={0}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          cursor: "help",
                          transition: "all 0.3s ease",
                          px: 2,
                          py: 0.5,
                          borderRadius: 10,
                          border: "1px solid transparent",
                          "&:hover": {
                            bgcolor: "amber.50",
                            borderColor: "amber.200",
                            "& .location-text": { color: "warning.dark" },
                            "& .location-chip": { display: "inline-block" },
                          },
                        }}
                      >
                        <IoGitBranchOutline />
                        <Typography
                          variant="h6"
                          fontSize={13}
                          className="location-text"
                          sx={{
                            color: "text.secondary",
                            transition: "color 0.3s",
                          }}
                        >
                          Upcoming Branch@{" "}
                          {
                            purpose?.surveyId?.parentBranch[0]
                              ?.branchStartedFrom
                          }
                        </Typography>
                        <Box
                          component="span"
                          className="location-chip"
                          sx={{
                            display: "none",
                            ml: 1,
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: "warning.contrastText",
                            bgcolor: "warning.light",
                            px: 1,
                            borderRadius: 1,
                          }}
                        >
                          {purpose?.surveyId?.parentBranch[0]?.name} @{" "}
                          {
                            purpose?.surveyId?.parentBranch[0]
                              ?.branchStartedFrom
                          }
                        </Box>
                      </Box>
                    </Tooltip>
                  </Stack>
                )}

              {page === 0 && purpose?.surveyId?.branchDetails?.isBranch && (
                <Stack
                  width="100%"
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Tooltip
                    title={
                      <Typography fontSize={12}>
                        🚧 Current Survey Location -{" "}
                        {purpose?.surveyId?.project}
                      </Typography>
                    }
                    arrow
                    placement="top"
                    enterTouchDelay={0}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        cursor: "help",
                        transition: "all 0.3s ease",
                        px: 2,
                        py: 0.5,
                        borderRadius: 10,
                        border: "1px solid transparent",
                        "&:hover": {
                          bgcolor: "amber.50",
                          borderColor: "amber.200",
                          "& .location-text": { color: "warning.dark" },
                          "& .location-chip": { display: "inline-block" },
                        },
                      }}
                    >
                      <IoGitBranchOutline />
                      <Typography
                        variant="h6"
                        fontSize={13}
                        className="location-text"
                        sx={{
                          color: "text.secondary",
                          transition: "color 0.3s",
                        }}
                      >
                        Branch Details
                      </Typography>
                      <Box
                        component="span"
                        className="location-chip"
                        sx={{
                          display: "none",
                          ml: 1,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          color: "warning.contrastText",
                          bgcolor: "warning.light",
                          px: 1,
                          borderRadius: 1,
                        }}
                      >
                        {purpose?.surveyId?.project}
                      </Box>
                    </Box>
                  </Tooltip>
                </Stack>
              )}
            </Stack>

            <Box width={"100%"} maxWidth={"md"}>
              <Grid container spacing={2} columns={12}>
                {page === 0 &&
                  inputData.map(({ size, ...input }, index) => (
                    <Grid
                      size={{
                        xs: size ? size : 12,
                      }}
                      key={index}
                    >
                      <Box
                        sx={{
                          "& .MuiOutlinedInput-root, & .MuiFilledInput-root": {
                            borderRadius: "15px",
                          },
                          width: "100%",
                        }}
                      >
                        {input.type === "select" ? (
                          <BasicSelect
                            {...input}
                            value={formValues[input.name] || ""}
                            error={(formErrors && formErrors[input.name]) || ""}
                            onChange={(e) => handleInputChange(e)}
                          />
                        ) : (
                          <BasicInput
                            {...input}
                            value={formValues[input.name] || ""}
                            error={(formErrors && formErrors[input.name]) || ""}
                            warning={
                              (formWarnings && formWarnings[input.name]) || ""
                            }
                            sx={{ width: "100%" }}
                            onChange={(e) => handleInputChange(e)}
                            disabled={input.disabled}
                          />
                        )}
                      </Box>
                    </Grid>
                  ))}

                {/* ✅ Dynamic Intermediate + Offset Rows */}
                {page === 1 &&
                  rowType === "Chainage" && (
                    <Grid size={{ xs: 12 }}>
                      {/* <Stack direction={'row'} alignItems={'center'}>
                  <BasicCheckbox
                    checked={autoOffset}
                    onChange={(e) => handleChangeAutoOffset(e)}
                  />
                  <Typography fontSize={'16px'} fontWeight={600} color="black">
                    Default offset
                  </Typography>
                </Stack> */}

                      <Stack
                        direction={"row"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                      >
                        <Typography
                          fontSize={"16px"}
                          fontWeight={600}
                          color="black"
                          mb={1}
                        >
                          Chainage: {formValues.chainage}
                        </Typography>

                        <Box sx={addButtonSx} onClick={handleAddRow}>
                          <IoAdd size={18} />
                          Add Row
                        </Box>
                      </Stack>

                      {/* ── Column headers ── */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: showBasis ? "1fr 32px 70px 1fr 28px" : "1fr 70px 1fr 28px",
                            sm: showBasis ? "90px 32px 90px 1fr 32px" : "90px 90px 1fr 32px",
                          },
                          gap: { xs: "4px", sm: "6px" },
                          px: 1,
                          pb: 0.5,
                        }}
                      >
                        {[
                          purpose.phase === "Proposal" ? "RL*" : "IS*",
                          showBasis ? "Basis" : null,
                          "Offset*",
                          "Remark*",
                          "",
                        ].filter(Boolean).map((h, i) => (
                          <Typography
                            key={i}
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "text.secondary",
                              fontSize: { xs: 9, sm: 11 },
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {h}
                          </Typography>
                        ))}
                      </Box>

                      <Stack spacing={0.75}>
                        {formValues.intermediateOffsets.map((row, idx) => (
                          <Box key={idx}>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: showBasis ? "1fr 32px 70px 1fr 28px" : "1fr 70px 1fr 28px",
                                  sm: showBasis ? "90px 32px 90px 1fr 32px" : "90px 90px 1fr 32px",
                                },
                                gap: { xs: "4px", sm: "6px" },
                                alignItems: "center",
                                px: 1,
                                py: 0.75,
                                borderRadius: 2,
                                bgcolor: idx % 2 === 0 ? "#f8f9ff" : "#fff",
                                border: "1px solid",
                                borderColor: "rgba(99,102,241,0.1)",
                                transition: "box-shadow 0.2s",
                                "&:hover": {
                                  boxShadow: "0 2px 8px rgba(99,102,241,0.12)",
                                },
                              }}
                            >
                              {/* IS / RL input */}
                              {purpose.phase === "Proposal" ? (
                                <BasicInput
                                  type="number"
                                  name="intermediateOffsets"
                                  value={row.reducedLevel || ""}
                                  error={
                                    formErrors &&
                                    formErrors[
                                      `intermediateOffsets[${idx}].reducedLevel`
                                    ]
                                  }
                                  sx={{
                                    padding: "8px 0px",
                                    "& input": {
                                      px: 1,
                                      py: 0.75,
                                      fontSize: 13,
                                    },
                                  }}
                                  onChange={(e) =>
                                    handleInputChange(e, idx, "reducedLevel")
                                  }
                                />
                              ) : (
                                <BasicInput
                                  type="number"
                                  name="intermediateOffsets"
                                  value={row.intermediateSight || ""}
                                  error={
                                    formErrors &&
                                    formErrors[
                                      `intermediateOffsets[${idx}].intermediateSight`
                                    ]
                                  }
                                  warning={
                                    formWarnings &&
                                    formWarnings[
                                      `intermediateOffsets[${idx}].intermediateSight`
                                    ] &&
                                    "disable-label"
                                  }
                                  sx={{
                                    padding: "8px 0px",
                                    "& input": {
                                      px: 1,
                                      py: 0.75,
                                      fontSize: 13,
                                    },
                                  }}
                                  onChange={(e) =>
                                    handleInputChange(
                                      e,
                                      idx,
                                      "intermediateSight",
                                    )
                                  }
                                />
                              )}

                              {/* S / R segmented switch — vertical */}
                              {showBasis && (
                                <Box
                                  onClick={() => {
                                    const updated = [
                                      ...formValues.intermediateOffsets,
                                    ];
                                    updated[idx] = {
                                      ...updated[idx],
                                      mode: updated[idx].mode === "S" ? "R" : "S",
                                    };
                                    setFormValues((prev) => ({
                                      ...prev,
                                      intermediateOffsets: updated,
                                    }));
                                  }}
                                  sx={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    width: 28,
                                    height: 44,
                                    borderRadius: "14px",
                                    bgcolor: "#e8e9f3",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    border: "1.5px solid",
                                    borderColor:
                                      row.mode === "R"
                                        ? "rgba(139,90,43,0.18)"
                                        : "rgba(2,132,199,0.18)",
                                    transition: "border-color 0.2s",
                                    "&:hover": {
                                      borderColor:
                                        row.mode === "R"
                                          ? "rgba(139,90,43,0.4)"
                                          : "rgba(2,132,199,0.4)",
                                    },
                                  }}
                                >
                                  {/* Sliding thumb — moves top/bottom */}
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      left: 2,
                                      top:
                                        row.mode === "R" ? 2 : "calc(50% - 1px)",
                                      width: "calc(100% - 4px)",
                                      height: "calc(50% - 1px)",
                                      borderRadius: "11px",
                                      bgcolor:
                                        row.mode === "R" ? "#8b5a2b" : "#0284c7", // R = brown (ground/land), S = blue (water)
                                      boxShadow:
                                        row.mode === "R"
                                          ? "0 2px 6px rgba(139,90,43,0.45)"
                                          : "0 2px 6px rgba(2,132,199,0.45)",
                                      transition:
                                        "top 0.22s cubic-bezier(.4,0,.2,1), background 0.22s",
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      position: "relative",
                                      zIndex: 1,
                                      flex: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "100%",
                                      fontSize: 10,
                                      fontWeight: 800,
                                      letterSpacing: 0.5,
                                      color:
                                        row.mode === "R"
                                          ? "#fff"
                                          : "rgba(80,80,120,0.55)",
                                      transition: "color 0.2s",
                                    }}
                                  >
                                    R
                                  </Typography>
                                  <Typography
                                    sx={{
                                      position: "relative",
                                      zIndex: 1,
                                      flex: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "100%",
                                      fontSize: 10,
                                      fontWeight: 800,
                                      letterSpacing: 0.5,
                                      color:
                                        row.mode === "S"
                                          ? "#fff"
                                          : "rgba(80,80,120,0.55)",
                                      transition: "color 0.2s",
                                    }}
                                  >
                                    S
                                  </Typography>
                                </Box>
                              )}

                              {/* Offset input */}
                              <BasicInput
                                type="number"
                                name="intermediateOffsets"
                                value={row.offset}
                                onChange={(e) =>
                                  handleInputChange(e, idx, "offset")
                                }
                                error={
                                  formErrors &&
                                  formErrors[
                                    `intermediateOffsets[${idx}].offset`
                                  ]
                                }
                                sx={{
                                  padding: "8px 0px",
                                  "& input": { px: 1, py: 0.75, fontSize: 13 },
                                }}
                              />

                              {/* Remark input */}
                              <BasicInput
                                type="text"
                                name="intermediateOffsets"
                                value={row.remark}
                                onChange={(e) =>
                                  handleInputChange(e, idx, "remark")
                                }
                                error={
                                  formErrors &&
                                  formErrors[
                                    `intermediateOffsets[${idx}].remark`
                                  ]
                                }
                                sx={{
                                  padding: "8px 0px",
                                  "& input": { px: 1, py: 0.75, fontSize: 13 },
                                }}
                              />

                              {/* Delete button */}
                              <Box
                                onClick={() => handleRemoveRow(idx)}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  cursor:
                                    formValues.intermediateOffsets.length <= 1
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    formValues.intermediateOffsets.length <= 1
                                      ? 0.3
                                      : 1,
                                  color: "#ef4444",
                                  transition: "background 0.15s",
                                  "&:hover":
                                    formValues.intermediateOffsets.length > 1
                                      ? { bgcolor: "rgba(239,68,68,0.1)" }
                                      : {},
                                }}
                              >
                                <IoIosRemove fontSize={"20px"} />
                              </Box>
                            </Box>

                            {/* Inline warning */}
                            {formWarnings &&
                              formWarnings[
                                `intermediateOffsets[${idx}].intermediateSight`
                              ] && (
                                <Typography
                                  variant="caption"
                                  sx={{ ml: 1, color: "warning.main" }}
                                >
                                  {
                                    formWarnings[
                                      `intermediateOffsets[${idx}].intermediateSight`
                                    ]
                                  }
                                </Typography>
                              )}
                          </Box>
                        ))}
                      </Stack>
                    </Grid>
                  )}
                {((page === 0 && rowType !== "Chainage") || page === 1) && (
                  <Grid width={"100%"}>
                    <ObservationNotes
                      value={formValues.observation}
                      onChange={(val) =>
                        setFormValues((prev) => ({ ...prev, observation: val }))
                      }
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Select Report Type Island */}
            {purpose &&
              purpose?.status === "Active" &&
              purpose?.phase === "Actual" &&
              page === 0 && (
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
                      background: "rgba(99, 102, 241, 0.15)", // Transparent indigo
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
                    {[
                      {
                        label: "CH",
                        value: "Chainage",
                        icon: <MdAddRoad fontSize="20px" />,
                        onClick: () => handleChangeRowType("Chainage"),
                      },
                      ...(isWaterWay
                        ? [
                            {
                              label: "WL",
                              value: "Water Level",
                              icon: <FaWater fontSize="20px" />,
                              onClick: () => handleChangeRowType("Water Level"),
                            },
                          ]
                        : []),
                      {
                        label: "CP",
                        value: "CP",
                        icon: <GiCrossroad fontSize="20px" />,
                        onClick: () => handleChangeRowType("CP"),
                      },
                      {
                        label: "TBM",
                        value: "TBM",
                        icon: <PiRoadHorizonFill fontSize="20px" />,
                        onClick: () => handleChangeRowType("TBM"),
                      },
                      {
                        label: "NEXT",
                        value: "",
                        icon: <FaLocationArrow fontSize="20px" />,
                        onClick: () => handleSubmit(),
                      },
                      // {
                      //   label: "OPTIONS",
                      //   value: "",
                      //   icon: <GrSafariOption fontSize="20px" />,
                      //   onClick: () => console.log("hi"),
                      // },
                    ].map(
                      (type, i) => {
                        const isDisabled = waterLevelLocked && type.label !== "NEXT";
                        return rowType !== type.value && (
                          <Box
                            key={i}
                            sx={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: { xs: 2, md: 6 },
                              height: "100%",
                              borderRadius: "16px",
                              cursor: isDisabled ? "not-allowed" : "pointer",
                              minWidth: "70px",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              bgcolor: "white",
                              color: rowType === type.value ? "white" : "#6366f1",
                              opacity: isDisabled ? 0.35 : 1,
                              transition: "all 0.3s ease",
                              "&:hover": {
                                bgcolor: isDisabled
                                  ? "white"
                                  : rowType === type.value ? "white" : "#f8fafc",
                              },
                            }}
                            onClick={isDisabled ? undefined : type.onClick}
                          >
                            {rowType === type.value && (
                              <Box
                                component={motion.div}
                                layoutId="activeReportType"
                                initial={false}
                                transition={{
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 25,
                                }}
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "#6366f1", // similar tone color for selected
                                  borderRadius: "16px",
                                  zIndex: 0,
                                  boxShadow:
                                    "0 4px 15px rgba(99, 102, 241, 0.3)",
                                }}
                              />
                            )}

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                flexDirection: { xs: "column", sm: "row" },
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
                                {type.icon}
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
                                {type.label}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }
                    )}
                  </Paper>
                </Box>
              )}

            {page === 1 && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent={"end"}
                width={"100%"}
                gap={2}
                pt={3}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ flex: 1 }}
                >
                  <BasicButtons
                    value={
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {(purpose?.phase === "Proposal" &&
                          isLastProposalReading &&
                          page === 1) ||
                        (rowType !== "Chainage" && isLastProposalReading) ? (
                          <>
                            <Typography
                              fontSize={"1.05rem"}
                              fontWeight={800}
                              letterSpacing="0.05em"
                              textTransform="uppercase"
                            >
                              Finish {purpose?.type}
                            </Typography>
                            <MdDone fontSize={"24px"} />
                          </>
                        ) : (
                          <>
                            <FaLocationArrow fontSize={"24px"} />
                            <Typography
                              fontSize={"1.05rem"}
                              fontWeight={800}
                              letterSpacing="0.05em"
                            >
                              NEXT
                            </Typography>
                          </>
                        )}
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
                      },
                    }}
                    fullWidth={true}
                    onClick={handleSubmit}
                    loading={btnLoading}
                  />
                </motion.div>
              </Stack>
            )}
          </Stack>

          <Activity
            mode={
              page === 0 &&
              purpose &&
              purpose?.rows?.length &&
              purpose?.rows[0]?.type === "CP" &&
              purpose?.status !== "Paused"
                ? "visible"
                : "hidden"
            }
          >
            <BasicDivider borderBottomWidth={0.5} color="#d9d9d9" />

            <Stack spacing={2} mt={2}>
              <Typography fontWeight={700} fontSize="16px">
                Previously added reading
              </Typography>

              <BasicCard
                sx={{
                  boxShadow: 1,
                }}
                contentSx={{ p: "16px !important" }}
                content={
                  <Stack
                    direction={"row"}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                  >
                    <Stack direction={"row"} spacing={1}>
                      <Typography fontSize={14} color="text.secondary">
                        Type of reading:
                      </Typography>
                      <Typography fontWeight={700} fontSize="14px">
                        {purpose?.rows?.at(-1)?.type === "Instrument setup"
                          ? "TBM"
                          : purpose?.rows?.at(-1)?.type}
                      </Typography>
                    </Stack>

                    <Stack direction={"row"} alignItems={"center"} spacing={1}>
                      <FaRegEdit
                        color="#2897FF"
                        onClick={handleClickOpenEdit}
                      />

                      <Activity
                        mode={purpose?.rows?.length > 1 ? "visible" : "hidden"}
                      >
                        <AiFillDelete
                          color="#fd3636ff"
                          fontSize={17}
                          onClick={handleDeletePrevReading}
                        />
                      </Activity>
                    </Stack>

                    <Activity mode={isEdit ? "visible" : "hidden"}>
                      <EditPreviousReading
                        open={isEdit}
                        doc={purpose?.rows?.at(-1) || {}}
                        updateDoc={setPurpose}
                        onCancel={handleClickCloseEdit}
                        onSubmit={handleClickCloseEdit}
                      />
                    </Activity>
                  </Stack>
                }
              />
            </Stack>
          </Activity>
        </Paper>
      </Container>
    </Box>
  );
};

export default RoadSurveyRowsForm;
