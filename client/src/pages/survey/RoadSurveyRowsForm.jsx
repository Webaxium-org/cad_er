import * as Yup from "yup";
import Plot from "react-plotly.js";
import { Activity, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import { Box, Stack, Typography, Grid, InputAdornment } from "@mui/material";
import BasicButtons from "../../components/BasicButton";
import { IoAdd, IoPauseCircleOutline } from "react-icons/io5";
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

const colors = {
  Initial: "green",
  Proposed: "blue",
  Final: "red",
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
  roadWidth: "",
  spacing: "",
  intermediateOffsets: [{ intermediateSight: "", offset: "", remark: "" }],
  intermediateSight: "",
  foreSight: "",
  backSight: "",
  remark: "",
};

const values = {
  Chainage: ["chainage", "roadWidth", "spacing", "intermediateOffsets"],
  CP: ["foreSight", "backSight", "remark"],
  TBM: ["intermediateSight", "remark"],
};

const inputDetails = [
  { label: "Chainage*", name: "chainage", placeholder: "0/000", type: "text" },
  { label: "Road width*", name: "roadWidth", type: "number", size: 6 },
  { label: "Spacing*", name: "spacing", type: "number", size: 6 },
  { label: "Fore sight*", name: "foreSight", type: "number", size: 6 },
  { label: "Back sight*", name: "backSight", type: "number", size: 6 },
  { label: "Remark*", name: "remark", type: "text" },
];

const RoadSurveyRowsForm = () => {
  const { id } = useParams();
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

  const schema = Yup.object().shape({
    type: Yup.string().required("Type is required"),

    chainage: Yup.string().when("type", {
      is: "Chainage",
      then: (schema) =>
        schema
          .required("Chainage is required")
          .matches(
            /^\d+(\/|\+|,)\d+(\.\d{1,3})?$/,
            "Invalid chainage format. Use ####/###.### or '####+###.###' or '####,###.###'"
          ),
      otherwise: (schema) => schema.nullable(),
    }),

    roadWidth: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value
      )
      .when("type", {
        is: "Chainage",
        then: (schema) =>
          schema
            .typeError("Road width is required")
            .required("Road width is required"),
        otherwise: (schema) => schema.nullable(),
      }),

    spacing: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value
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
        })
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
        is: "TBM",
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
        is: (val) => ["CP", "TBM"].includes(val),
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

  const speedDialActions = [
    {
      icon: <PiLinkSimpleBreakBold />,
      name: "Add Break",
      onClick: () => {},
      show: true,
    },
    {
      icon: <IoGitBranchOutline />,
      name: "Add Branch",
      onClick: () => {},
      show: true,
    },
    {
      icon: <AiOutlinePauseCircle />,
      name: "Pause Survey",
      onClick: () => handleClickOpen("Pause Survey"),
      show:
        purpose &&
        purpose?.type === "Initial Level" &&
        purpose?.status !== "Paused" &&
        page === 0,
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
        })
      );

      setOpen(false);
    } else {
      let updatedAlertData = null;

      if (action === "Finish Survey" && purpose?.phase === "Actual") {
        updatedAlertData = {
          ...finishSurveyAlertData,
          onSubmit: handleEndSurveyPurpose,
          content: (
            <Box mt={2}>
              <Stack direction={"row"} alignItems={"center"}>
                <Typography fontSize={"16px"} fontWeight={600} color="black">
                  Auto calculate
                </Typography>
                <BasicCheckbox
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
            { intermediateSight: "", offset: "", remark: "" },
          ],
        });

        getNewChainage(purposeDoc);

        setPurpose(purposeDoc);

        dispatch(
          showAlert({
            type: "success",
            message: `${prevReading.type} deleted successfully`,
          })
        );
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    }
  };

  const updateInputData = () => {
    const filteredInputData = inputDetails
      ?.map((d) => {
        if (rowType === "CP" && d.name === "backSight") {
          return {
            ...d,
            disabled: true,
          };
        }

        return d;
      })
      ?.filter((d) => values[rowType]?.includes(d.name));

    if (rowType === "TBM") {
      filteredInputData.unshift({
        label: "Intermediate sight*",
        name: "intermediateSight",
        type: "number",
      });
    }

    setFormValues((prev) => ({ ...prev, type: rowType }));
    setInputData(filteredInputData);
  };

  const handleChangeRowType = (type) => setRowType(type);

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
      (o) => o.intermediateSight.length
    );

    intermediateOffsets
      ?.sort((a, b) => a - b)
      ?.forEach((entry, i) => {
        if (i >= updatedRows.length) {
          const parsedEntry = Number(entry);

          updatedRows[i] = {
            offset: entry,
            intermediateSight: "",
            remark: parsedEntry < 0 ? "LHS" : parsedEntry === 0 ? "PLS" : "RHS",
          };
        } else {
          updatedRows[i].offset = entry;
          updatedRows[i].intermediateSight =
            updatedRows[i].intermediateSight || "";
          updatedRows[i].remark = updatedRows[i].remark;
        }
      });

    setFormValues((prev) => ({ ...prev, intermediateOffsets: updatedRows }));
    handleChangeReducedLevel(updatedRows);
  };

  const handleInputChange = async (event, index, field) => {
    const { name, value } = event.target;

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
          })
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
    setFormValues((prev) => ({
      ...prev,
      intermediateOffsets: [
        ...(formValues.intermediateOffsets || []),
        { intermediateSight: "", offset: "", remark: "" },
      ],
    }));

    setInputData([...inputData]);
  };

  const handleRemoveRow = (index) => {
    if (formValues.intermediateOffsets.length > 1) {
      setFormValues((prev) => ({
        ...prev,
        intermediateOffsets: formValues.intermediateOffsets.filter(
          (_, idx) => idx !== index
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
          (p) => p.type === "Initial Level"
        );
        if (purpose?.rows?.length) {
          const prevChainage = purpose?.rows?.at(-1)?.chainage;

          const filteredInitialSurvey =
            initialSurvey?.rows?.filter((r) => r.type === "Chainage") ?? [];

          const currentIndex = filteredInitialSurvey.findIndex(
            (r) => r.chainage === prevChainage
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
            (r) => r.type === "Chainage"
          );
        }

        if (currentReading) {
          const updatedValues = {
            chainage: currentReading?.chainage || "",
            roadWidth: currentReading?.roadWidth || "",
            spacing: currentReading?.spacing || "",
          };

          setFormValues((prev) => ({
            ...prev,
            ...updatedValues,
          }));
        }
      } else {
        const isFirstChainage = purpose?.rows?.find(
          (r) => r.type === "Chainage"
        );

        if (!isFirstChainage) {
          setFormValues((prev) => ({
            ...prev,
            chainage: `0${purpose?.surveyId?.separator || "/"}000`,
          }));
        } else {
          const lastChainage = purpose?.rows
            ?.filter((r) => r.type === "Chainage")
            ?.at(-1);

          const chainageMultiple = purpose?.surveyId?.chainageMultiple;
          const lastDigit = Number(
            lastChainage.chainage.split(purpose?.surveyId?.separator || "/")[1]
          );

          const remainder = lastDigit % chainageMultiple;
          const nextNumber =
            remainder === 0
              ? lastDigit + chainageMultiple
              : lastDigit + (chainageMultiple - remainder);

          const nextChainage = `0${purpose?.surveyId?.separator || "/"}${String(
            nextNumber
          ).padStart(3, "0")}`;

          setFormValues((prev) => ({
            ...prev,
            chainage: nextChainage,
            roadWidth: Number(lastChainage?.roadWidth) || "",
            spacing: lastChainage?.spacing || "",
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
          (a, b) => a.offset - b.offset
        );

        payload = {
          ...formValues,
          reducedLevels:
            purpose.phase !== "Proposal"
              ? []
              : sortedOffsets.map((r) => r.reducedLevel),
          intermediateSight:
            purpose.phase === "Proposal"
              ? []
              : sortedOffsets.map((r) => r.intermediateSight),
          offsets: sortedOffsets.map((r) => r.offset),
          remark: sortedOffsets.map((r) => r.remark),
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
            { intermediateSight: "", offset: "", remark: "" },
          ],
        });

        getNewChainage(purposeDoc);

        if (rowType === "Chainage") {
          setPage(0);
        }

        if (
          (purpose.type === "Initial Level" && rowType === "TBM") ||
          purpose.status === "Paused"
        ) {
          setRowType("Chainage");
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

      if (purpose.type === "Initial Level") {
        const inpFinalForesight = document.getElementById("finalForesight");
        const inpPLS = document.getElementById("pls");

        if (!inpFinalForesight?.value?.trim()) {
          inpFinalForesight.parentElement.parentElement.classList.add(
            "inp-err"
          );

          return;
        } else {
          inpFinalForesight.parentElement.parentElement.classList.remove(
            "inp-err"
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
        dispatch(
          showAlert({
            type: "success",
            message: `${purpose.type} Finished`,
          })
        );

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
        inputsToMap.inpPauseRemark
      );

      if (data.success) {
        dispatch(
          showAlert({
            type: "success",
            message: `${purpose.type} Paused`,
          })
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
        intermediateSight: values.map((v) => v.intermediateSight),
      };
      const calculatedData = getLastRlAndHi(
        purpose.surveyId,
        newReading,
        purpose._id
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
      (lv) => lv !== null && lv !== undefined
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
      (p) => p.type === value
    );

    const newRow = findPurpose?.rows?.find(
      (r) => r.chainage === formValues.chainage
    );

    const safeProposal = newRow?.reducedLevels || [];

    const newData = {
      name: findPurpose.type,
      color: getColor(findPurpose.type),
      data: makeSeries(newRow?.offsets, safeProposal),
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

        const purposeDoc = data.purpose;

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
            remark: lastRow.remarks[0],
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
  }, [id]);

  useEffect(() => {
    // Replace instead of push
    window.history.replaceState(null, "", window.location.href);

    const handlePopState = (event) => {
      // Immediately restore the same page without adding history
      window.history.replaceState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <Box p={3}>
      <AlertDialogSlide {...alertData} open={open} onCancel={handleClose} />

      {page === 1 && (
        <Box
          sx={{
            border: "1px solid #EFEFEF",
            borderRadius: "9px",
            width: "40px",
            height: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setPage(0)}
        >
          <MdArrowBackIosNew />
        </Box>
      )}

      {rowType === "Chainage" &&
        page === 1 &&
        selectedCs &&
        selectedCs?.series && (
          <Box position={"sticky"} top={0} bgcolor={"white"} zIndex={2}>
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
                line: { shape: "linear", width: 1, color: s.color },
              }))}
              config={chartOptions.config}
              layout={chartOptions.layout}
              style={{ width: "100%", height: 100 }}
            />
          </Box>
        )}

      <Stack alignItems={"center"} spacing={2}>
        <Typography variant="h6" fontSize={18} fontWeight={700} align="center">
          {page === 1
            ? `Please Enter Intermediate Sight`
            : `Please Enter ${rowType} and Values`}
          :
        </Typography>

        {page === 0 && (
          <Stack direction={"row"} justifyContent={"end"} width={"100%"}>
            <Box width={"40px"} zIndex={2}>
              <BasicSpeedDial
                actions={speedDialActions?.filter((a) => a.show)}
                direction={"down"}
                sx={{
                  top: "-8px",
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
                    <BasicInput
                      {...input}
                      value={formValues[input.name] || ""}
                      error={(formErrors && formErrors[input.name]) || ""}
                      warning={(formWarnings && formWarnings[input.name]) || ""}
                      sx={{ width: "100%" }}
                      onChange={(e) => handleInputChange(e)}
                      disabled={input.disabled}
                    />
                  </Box>
                </Grid>
              ))}

            {/* ✅ Dynamic Intermediate + Offset Rows */}
            {page === 1 && rowType === "Chainage" && (
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
                <Typography
                  fontSize={"16px"}
                  fontWeight={600}
                  color="black"
                  mb={1}
                >
                  Chainage: {formValues.chainage}
                </Typography>
                <Stack spacing={2}>
                  {formValues.intermediateOffsets.map((row, idx) => (
                    <Stack key={idx} spacing={1}>
                      <Stack
                        key={idx}
                        direction={"row"}
                        alignItems={"end"}
                        spacing={1}
                        width={"100%"}
                      >
                        {purpose.phase === "Proposal" ? (
                          <BasicInput
                            label={idx === 0 ? "RL*" : ""}
                            type="number"
                            name="intermediateOffsets"
                            value={row.reducedLevel || ""}
                            error={
                              formErrors &&
                              formErrors[
                                `intermediateOffsets[${idx}].reducedLevel`
                              ]
                            }
                            sx={{ width: "100%" }}
                            onChange={(e) =>
                              handleInputChange(e, idx, "reducedLevel")
                            }
                          />
                        ) : (
                          <BasicInput
                            label={idx === 0 ? "IS*" : ""}
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
                            sx={{ width: "100%" }}
                            onChange={(e) =>
                              handleInputChange(e, idx, "intermediateSight")
                            }
                          />
                        )}

                        <BasicInput
                          label={idx === 0 ? "Offset*" : ""}
                          type="number"
                          name="intermediateOffsets"
                          value={row.offset}
                          onChange={(e) => handleInputChange(e, idx, "offset")}
                          error={
                            formErrors &&
                            formErrors[`intermediateOffsets[${idx}].offset`]
                          }
                        />
                        <BasicInput
                          label={idx === 0 ? "Remark*" : ""}
                          type="text"
                          name="intermediateOffsets"
                          value={row.remark}
                          onChange={(e) => handleInputChange(e, idx, "remark")}
                          error={
                            formErrors &&
                            formErrors[`intermediateOffsets[${idx}].remark`]
                          }
                        />
                        <Box>
                          {idx ===
                          formValues.intermediateOffsets?.length - 1 ? (
                            <Stack direction={"row"} spacing={1}>
                              {formValues.intermediateOffsets?.length > 1 && (
                                <Box
                                  className="remove-new-sight"
                                  onClick={() => handleRemoveRow(idx)}
                                >
                                  <IoIosRemove
                                    fontSize={"24px"}
                                    color="rgb(231 0 0)"
                                  />
                                </Box>
                              )}

                              <Box
                                className="add-new-sight"
                                onClick={handleAddRow}
                              >
                                <IoAdd fontSize={"24px"} color="#0059E7" />
                              </Box>
                            </Stack>
                          ) : (
                            <Box
                              className="remove-new-sight"
                              onClick={() => handleRemoveRow(idx)}
                            >
                              <IoIosRemove
                                fontSize={"24px"}
                                color="rgb(231 0 0)"
                              />
                            </Box>
                          )}
                        </Box>
                      </Stack>
                      {formWarnings &&
                        formWarnings[
                          `intermediateOffsets[${idx}].intermediateSight`
                        ] && (
                          <Typography
                            variant="caption"
                            sx={{
                              mb: 0.5,
                              color: "warning.main",
                            }}
                          >
                            {
                              formWarnings[
                                `intermediateOffsets[${idx}].intermediateSight`
                              ]
                            }
                          </Typography>
                        )}
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            )}
          </Grid>
        </Box>

        <Stack direction={"row"} justifyContent={"end"} width={"100%"} gap={1}>
          {purpose &&
            purpose?.status === "Active" &&
            purpose?.phase === "Actual" &&
            page === 0 && (
              <>
                {rowType !== "Chainage" && (
                  <BasicButtons
                    value={
                      <Box display={"flex"} gap={1} alignItems={"center"}>
                        <IoIosAddCircleOutline fontSize={"20px"} />
                        <Typography fontSize={"16px"} fontWeight={600}>
                          Chainage
                        </Typography>
                      </Box>
                    }
                    onClick={() => handleChangeRowType("Chainage")}
                    sx={{ backgroundColor: "#0059E7", flex: 1 }}
                  />
                )}
                {rowType !== "CP" && (
                  <BasicButtons
                    value={
                      <Box display={"flex"} gap={1} alignItems={"center"}>
                        <IoIosAddCircleOutline fontSize={"20px"} />
                        <Typography fontSize={"16px"} fontWeight={600}>
                          CP
                        </Typography>
                      </Box>
                    }
                    onClick={() => handleChangeRowType("CP")}
                    sx={{ backgroundColor: "#0059E7", flex: 1 }}
                  />
                )}
                {rowType !== "TBM" && (
                  <BasicButtons
                    value={
                      <Box display={"flex"} gap={1} alignItems={"center"}>
                        <IoIosAddCircleOutline fontSize={"20px"} />
                        <Typography fontSize={"16px"} fontWeight={600}>
                          TBM
                        </Typography>
                      </Box>
                    }
                    onClick={() => handleChangeRowType("TBM")}
                    sx={{ backgroundColor: "#0059E7", flex: 1 }}
                  />
                )}
              </>
            )}

          <BasicButtons
            value={
              <Box display={"flex"} gap={1} alignItems={"center"}>
                {(purpose?.phase === "Proposal" &&
                  isLastProposalReading &&
                  page === 1) ||
                (rowType !== "Chainage" && isLastProposalReading) ? (
                  <>
                    <Typography fontSize={"16px"} fontWeight={600}>
                      Finish ${purpose?.type}
                    </Typography>
                    <MdDone fontSize={"20px"} />
                  </>
                ) : (
                  <>
                    <Typography fontSize={"16px"} fontWeight={600}>
                      Continue
                    </Typography>
                    <IoIosArrowForward fontSize={"20px"} />
                  </>
                )}
              </Box>
            }
            sx={{
              backgroundColor: "rgba(24, 195, 127, 1)",
              height: "45px",
              flex: 1,
            }}
            fullWidth={true}
            onClick={handleSubmit}
            loading={btnLoading}
          />
        </Stack>

        {rowType === "CP" && purpose.phase === "Actual" && (
          <BasicButtons
            value={
              <Box display={"flex"} gap={1} alignItems={"center"}>
                <Typography fontSize={"16px"} fontWeight={600}>
                  Finish Survey
                </Typography>
                <MdDone fontSize={"20px"} />
              </Box>
            }
            sx={{ backgroundColor: "#4caf50", height: "45px", flex: 1 }}
            fullWidth={true}
            onClick={() => handleClickOpen("Finish Survey")}
            loading={btnLoading}
          />
        )}
      </Stack>

      <Activity mode={page === 0 && purpose ? "visible" : "hidden"}>
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
                  <FaRegEdit color="#2897FF" onClick={handleClickOpenEdit} />

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
    </Box>
  );
};

export default RoadSurveyRowsForm;
