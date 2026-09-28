import * as Yup from "yup";
import {
  Box,
  Grid,
  Stack,
  Typography,
  Paper,
  Container,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Checkbox,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdArrowBackIosNew } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import BasicButtons from "../../components/BasicButton";
import { useDispatch } from "react-redux";
import { handleFormError } from "../../utils/handleFormError";
import { startLoading, stopLoading } from "../../redux/loadingSlice";
import BasicSelect from "../../components/BasicSelect";
import BasicInput from "../../components/BasicInput";
import {
  createSurvey,
  queueSurvey,
  completeSurvey,
  getSurvey,
} from "../../services/surveyServices";
import AlertDialogSlide from "../../components/AlertDialogSlide";
import AdvancedAutoComplete from "../../components/AdvancedAutoComplete";
import SmallHeader from "../../components/SmallHeader";
import { getSettings, updateInstrument, updateSettingsFields } from "../../services/settingsServices";
import { CgGoogleTasks } from "react-icons/cg";
import { FaLocationArrow } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";

const commissioningFields = {
  publicProject: {
    Department: "department",
    Division: "division",
    "Sub-Division": "subDivision",
    Section: "section",
  },
  privateProject: {
    Client: "client",
    Contractor: "contractor",
    Consultant: "consultant",
  },
};

const commissioningOptionFields = Object.fromEntries(
  Object.entries(commissioningFields).map(([category, fields]) => [
    category,
    Object.fromEntries(
      Object.entries(fields).map(([label, name]) => [name, label]),
    ),
  ]),
);

const editableCommissioningFields = {
  Government: ["Department", "Agreement No.", "Division", "Sub-Division", "Section", "Contractor"],
  "Corporate / Private": ["Client", "Agreement No.", "Contractor", "Consultant", "Additional field 1", "Additional field 2"],
};
const editableStaffFields = [1, 2, 3, 4, 5, 6].map((number) => `Staff ${number}`);

const surveyorRoles = [
  { label: "Engineer", value: "Engineer" },
  { label: "Senior Surveyor", value: "Senior Surveyor" },
  { label: "Junior Surveyor", value: "Junior Surveyor" },
];

const assistantsForRole = (staff, role) => {
  const settingsRole = role === "Engineer" ? "Engineer / Site In-Charge" : role;
  const saved = staff?.[settingsRole] || {};
  const legacyFields = ["Name", "Phone", "Email", "Field 4", "Field 5"];
  return Object.fromEntries(
    legacyFields.map((legacyField, index) => [
      `assistant${index + 1}`,
      saved[`Staff ${index + 1}`] ?? saved[legacyField] ?? "",
    ]),
  );
};

// ─── Step 1 Fields ────────────────────────────────────────────────────────────
const step1Fields = [
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
  },
  {
    label: "Select Commissioning Entity",
    name: "category",
    mode: "checkbox",
    hidden: false,
    options: [
      { name: "noneProject", label: "None" },
      { name: "publicProject", label: "Public project" },
      { name: "privateProject", label: "Private project" },
    ],
  },
  {
    label: "Department*",
    name: "department",
    type: "text",
    size: 6,
    hidden: false, // toggled by category
  },
  {
    label: "Division*",
    name: "division",
    type: "text",
    size: 6,
    hidden: false,
  },
  {
    label: "Sub division*",
    name: "subDivision",
    type: "text",
    size: 6,
    hidden: false,
  },
  {
    label: "Section*",
    name: "section",
    type: "text",
    size: 6,
    hidden: false,
  },
  {
    label: "Contractor*",
    name: "contractor",
    type: "text",
    size: 6,
    hidden: true,
  },
  {
    label: "Consultant*",
    name: "consultant",
    type: "text",
    size: 6,
    hidden: true,
  },
  {
    label: "Client*",
    name: "client",
    type: "text",
    hidden: true,
  },
  { label: "Agreement no*", name: "agreementNo", type: "text" },
  { label: "Select equipment", name: "hasEquipment", mode: "toggle" },
  { label: "Instrument model*", name: "instrumentModel", type: "text", size: 6 },
  { label: "Instrument number*", name: "instrumentNo", type: "text", size: 6 },
  { label: "Technical lead", name: "hasTechnicalLead", mode: "toggle" },
  {
    label: "Engineer / Surveyor*",
    name: "engineerSurveyor",
    mode: "select",
    options: surveyorRoles,
    size: 6,
  },
  { label: "Assistant 1*", name: "assistant1", type: "text", size: 6 },
  { label: "Assistant 2*", name: "assistant2", type: "text", size: 6 },
  { label: "Assistant 3*", name: "assistant3", type: "text", size: 6 },
  { label: "Assistant 4*", name: "assistant4", type: "text", size: 6 },
  { label: "Assistant 5*", name: "assistant5", type: "text", size: 6 },
];

// ─── Step 2 Fields ────────────────────────────────────────────────────────────
const step2Fields = [
  {
    label: "Set chainage multiple*",
    name: "chainageMultiple",
    mode: "solo-create",
    options: [5, 10, 20, 30, 50].map((n) => ({ label: n, value: n })),
    size: 6,
  },
  {
    label: "Select separator*",
    name: "separator",
    mode: "select",
    options: ["/", "+", ","].map((n) => ({ label: n, value: n })),
    size: 6,
  },
  { label: "Reduced level*", name: "reducedLevel", type: "number" },
  { label: "Back sight*", name: "backSight", type: "number", size: 6 },
  { label: "Remark*", name: "remark", type: "text", size: 6 },
];

// ─── Initial values ───────────────────────────────────────────────────────────
const initialFormValues = {
  project: "",
  projectType: "None",
  purpose: "Initial Level",
  department: "",
  division: "",
  subDivision: "",
  section: "",
  consultant: "",
  client: "",
  hasEquipment: false,
  instrumentModel: "",
  hasTechnicalLead: false,
  engineerSurveyor: "",
  assistant1: "",
  assistant2: "",
  assistant3: "",
  assistant4: "",
  assistant5: "",
  // Step 2
  agreementNo: "",
  contractor: "",
  instrumentNo: "",
  backSight: "",
  remark: "TBM - 1",
  reducedLevel: "",
  chainageMultiple: "",
  separator: "",
};

const initialQueueValues = {
  proposalScheduleDate: "",
  proposalDeadline: "",
  location: "",
  finalScheduleDate: "",
  finalDeadline: "",
};

// ─── Yup schemas ──────────────────────────────────────────────────────────────
const buildStep1Schema = (category, hasEquipment, hasTechnicalLead) =>
  Yup.object().shape({
    project: Yup.string().required("Project name is required"),
    purpose: Yup.string().required("Purpose is required"),
    department:
      category === "publicProject"
        ? Yup.string().required("Department is required")
        : Yup.string().nullable(),
    division:
      category === "publicProject"
        ? Yup.string().required("Division is required")
        : Yup.string().nullable(),
    subDivision:
      category === "publicProject"
        ? Yup.string().required("Sub division is required")
        : Yup.string().nullable(),
    section:
      category === "publicProject"
        ? Yup.string().required("Section is required")
        : Yup.string().nullable(),
    consultant:
      category === "privateProject"
        ? Yup.string().required("Consultant is required")
        : Yup.string().nullable(),
    client:
      category === "privateProject"
        ? Yup.string().required("Client is required")
        : Yup.string().nullable(),
    contractor:
      category === "privateProject"
        ? Yup.string().required("Contractor is required")
        : Yup.string().nullable(),
    agreementNo:
      category === "noneProject"
        ? Yup.string().nullable()
        : Yup.string().required("Agreement no is required"),
    instrumentModel: hasEquipment ? Yup.string().trim().required("Instrument model is required") : Yup.string().nullable(),
    instrumentNo: hasEquipment ? Yup.string().trim().required("Instrument number is required") : Yup.string().nullable(),
    engineerSurveyor: hasTechnicalLead ? Yup.string().required("Engineer / Surveyor is required") : Yup.string().nullable(),
    ...Object.fromEntries([1, 2, 3, 4, 5].map((number) => [
      `assistant${number}`,
      hasTechnicalLead ? Yup.string().trim().required(`Assistant ${number} is required`) : Yup.string().nullable(),
    ])),
  });

const step2Schema = Yup.object().shape({
  chainageMultiple: Yup.number()
    .typeError("Chainage multiple must be a number")
    .required("Chainage multiple is required")
    .moreThan(0, "Chainage multiple must be greater than 0"),
  separator: Yup.string()
    .required("Separator is required")
    .matches(/^[/+,]$/, "Only '/', '+', ',' are allowed"),
  backSight: Yup.number()
    .typeError("Backsight is required")
    .required("Backsight is required"),
  remark: Yup.string().required("Remark is required"),
  reducedLevel: Yup.number()
    .typeError("Reduced level is required")
    .required("Reduced level is required"),
});

const queueSchema = Yup.object().shape({
  proposalScheduleDate: Yup.string().required(
    "Proposal Schedule Date is required",
  ),
  proposalDeadline: Yup.string().required("Proposal Deadline is required"),
  location: Yup.string().required("Location is required"),
  finalScheduleDate: Yup.string().nullable(),
  finalDeadline: Yup.string().nullable(),
});

const getDefaultRemark = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `TBM - 1 (${day}-${month}-${year} ${h12}.${minutes}${ampm})`;
};

// ─── Animation variants ───────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────
const RoadSurveyForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();

  // If navigated with surveyId + step=2 (continuing a queued project)
  const existingSurveyId = locationState?.surveyId || null;

  const [step, setStep] = useState(locationState?.step === 2 ? 2 : 1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const [category, setCategory] = useState("noneProject");
  const [commissioningDefaults, setCommissioningDefaults] = useState(null);
  const [instrumentOptions, setInstrumentOptions] = useState([]);
  const [instrumentRecords, setInstrumentRecords] = useState([]);
  const [editingInstrument, setEditingInstrument] = useState(false);
  const [editedInstrument, setEditedInstrument] = useState(null);
  const [instrumentEditError, setInstrumentEditError] = useState("");
  const [savingInstrument, setSavingInstrument] = useState(false);
  const [settingsEdit, setSettingsEdit] = useState(null);
  const [settingsEditError, setSettingsEditError] = useState("");
  const [savingSettingsEdit, setSavingSettingsEdit] = useState(false);
  const [staffDefaults, setStaffDefaults] = useState(null);
  const agreementByCategory = useRef({});
  const [formValues, setFormValues] = useState(() => ({
    ...initialFormValues,
    type: locationState?.type || "Road Survey",
    remark: getDefaultRemark(),
  }));
  const [formErrors, setFormErrors] = useState(null);
  const [queueValues, setQueueValues] = useState(initialQueueValues);
  const [queueErrors, setQueueErrors] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [noneWarningAction, setNoneWarningAction] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    if (existingSurveyId) return;
    let active = true;
    getSettings()
      .then(({ data }) => {
        if (!active) return;
        const settings = data.settings || {};
        setStaffDefaults(settings.staff || {});
        setInstrumentRecords(settings.instruments || []);
        setInstrumentOptions(
          [
            ...new Set(
              (settings.instruments || [])
                .map((instrument) => instrument?.serial?.trim())
                .filter(Boolean),
            ),
          ].map((serial) => ({ label: serial, value: serial })),
        );
        const saved = settings.commissioning || {};
        const commissioning =
          saved.Government || saved["Corporate / Private"]
            ? saved
            : { [settings.commissioningType || "Government"]: saved };
        setCommissioningDefaults(commissioning);
      })
      .catch(() => {
        // Survey creation remains available when settings cannot be loaded.
      });
    return () => {
      active = false;
    };
  }, [existingSurveyId]);

  useEffect(() => {
    if (!staffDefaults || existingSurveyId) return;
    setFormValues((current) => {
      if (!current.engineerSurveyor) return current;
      const assistants = assistantsForRole(
        staffDefaults,
        current.engineerSurveyor,
      );
      return {
        ...current,
        ...Object.fromEntries(
          Object.entries(assistants).map(([key, value]) => [
            key,
            current[key] || value,
          ]),
        ),
      };
    });
  }, [staffDefaults, existingSurveyId]);

  useEffect(() => {
    if (!category || existingSurveyId) return;
    setFormValues((current) => ({
      ...current,
      agreementNo: agreementByCategory.current[category] ?? "",
    }));
  }, [category, existingSurveyId]);

  // Derive visible step-1 fields based on category and selected surveyor role
  const visibleStep1Fields = step1Fields.map((f) => {
    if (["instrumentModel", "instrumentNo"].includes(f.name)) {
      return { ...f, hidden: !formValues.hasEquipment };
    }
    if (f.name === "engineerSurveyor" || /^assistant[1-5]$/.test(f.name)) {
      return { ...f, hidden: !formValues.hasTechnicalLead };
    }
    if (["department", "division", "subDivision", "section"].includes(f.name)) {
      return { ...f, hidden: category !== "publicProject" };
    }
    if (["consultant", "client", "contractor"].includes(f.name)) {
      return { ...f, hidden: category !== "privateProject" };
    }
    if (f.name === "agreementNo") {
      return { ...f, hidden: category === "noneProject" };
    }
    return f;
  });

  const handleGoBack = () => navigate(-1);

  // ─── Input changes ──────────────────────────────────────────────────────────
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === "agreementNo" && category) {
      agreementByCategory.current[category] = value;
    }
    setFormValues((prev) =>
      name === "engineerSurveyor"
        ? {
            ...prev,
            engineerSurveyor: value,
            ...assistantsForRole(staffDefaults, value),
          }
        : name === "instrumentNo"
          ? {
              ...prev,
              instrumentNo: value,
              instrumentModel: instrumentRecords.find((item) => item.serial?.trim() === value)?.model?.trim() || prev.instrumentModel,
            }
          : name === "instrumentModel"
            ? { ...prev, instrumentModel: value, instrumentNo: "" }
            : { ...prev, [name]: value },
    );
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSaveInstrument = async () => {
    const previousSerial = formValues.instrumentNo;
    const serial = editedInstrument?.serial?.trim();
    const model = editedInstrument?.model?.trim();
    if (!serial || !model) {
      setInstrumentEditError("Instrument model and number are required");
      return;
    }
    setSavingInstrument(true);
    setInstrumentEditError("");
    try {
      const { data } = await updateInstrument(previousSerial, editedInstrument);
      setInstrumentRecords(data.instruments);
      setInstrumentOptions(
        [...new Set(data.instruments.map((instrument) => instrument?.serial?.trim()).filter(Boolean))]
          .map((value) => ({ label: value, value })),
      );
      setFormValues((current) => ({ ...current, instrumentNo: serial, instrumentModel: model }));
      setEditingInstrument(false);
      setEditedInstrument(null);
    } catch (error) {
      setInstrumentEditError(error.response?.data?.message || "Could not update the saved instrument.");
    } finally {
      setSavingInstrument(false);
    }
  };

  const openSettingsEdit = (section, group) => {
    const fields = section === "staff" ? editableStaffFields : editableCommissioningFields[group];
    const saved = section === "staff" ? staffDefaults?.[group] || {} : commissioningDefaults?.[group] || {};
    const legacy = ["Name", "Phone", "Email", "Field 4", "Field 5", "Field 6"];
    setSettingsEdit({
      section,
      group,
      values: Object.fromEntries(fields.map((field, index) => [
        field,
        saved[field] ?? (section === "staff" ? saved[legacy[index]] : "") ?? "",
      ])),
    });
    setSettingsEditError("");
  };

  const handleSaveSettingsEdit = async () => {
    if (!settingsEdit) return;
    const { section, group, values } = settingsEdit;
    setSavingSettingsEdit(true);
    setSettingsEditError("");
    try {
      const { data } = await updateSettingsFields(section, group, values);
      if (section === "staff") {
        const oldAssistants = assistantsForRole(staffDefaults, formValues.engineerSurveyor);
        const updatedStaff = { ...staffDefaults, [group]: data.values };
        const newAssistants = assistantsForRole(updatedStaff, formValues.engineerSurveyor);
        setStaffDefaults(updatedStaff);
        if (group === (formValues.engineerSurveyor === "Engineer" ? "Engineer / Site In-Charge" : formValues.engineerSurveyor)) {
          setFormValues((current) => ({
            ...current,
            ...Object.fromEntries(Object.keys(newAssistants)
              .filter((key) => current[key] === oldAssistants[key])
              .map((key) => [key, newAssistants[key]])),
          }));
        }
      } else {
        const previous = commissioningDefaults?.[group] || {};
        setCommissioningDefaults((current) => ({ ...current, [group]: data.values }));
        const activeGroup = category === "publicProject" ? "Government" : category === "privateProject" ? "Corporate / Private" : null;
        if (group === activeGroup) {
          const names = { ...commissioningFields[category], "Agreement No.": "agreementNo" };
          setFormValues((current) => ({
            ...current,
            ...Object.fromEntries(Object.entries(names)
              .filter(([field, name]) => current[name] === (previous[field] || ""))
              .map(([field, name]) => [name, data.values[field] || ""])),
          }));
          if (agreementByCategory.current[category] === (previous["Agreement No."] || "")) {
            agreementByCategory.current[category] = data.values["Agreement No."] || "";
          }
        }
      }
      setSettingsEdit(null);
    } catch (error) {
      setSettingsEditError(error.response?.data?.message || "Could not save Settings.");
    } finally {
      setSavingSettingsEdit(false);
    }
  };

  const handleQueueChange = (event) => {
    const { name, value } = event.target;
    setQueueValues((prev) => ({ ...prev, [name]: value }));
    setQueueErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ─── Step navigation ────────────────────────────────────────────────────────
  const handleNext = async () => {
    const schema = buildStep1Schema(category, formValues.hasEquipment, formValues.hasTechnicalLead);
    try {
      await schema.validate(formValues, { abortEarly: false });
      setFormErrors(null);
      if (category === "noneProject") {
        setNoneWarningAction("next");
      } else {
        setDirection(1);
        setStep(2);
      }
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => {
          errs[e.path] = e.message;
        });
        setFormErrors(errs);
      }
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(1);
    setFormErrors(null);
  };

  // ─── Open Queue modal (validates step 1 first) ──────────────────────────────
  const handleOpenQueue = async () => {
    const schema = buildStep1Schema(category, formValues.hasEquipment, formValues.hasTechnicalLead);
    try {
      await schema.validate(formValues, { abortEarly: false });
      setFormErrors(null);
      if (category === "noneProject") {
        setNoneWarningAction("queue");
      } else {
        setQueueOpen(true);
      }
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => {
          errs[e.path] = e.message;
        });
        setFormErrors(errs);
      }
    }
  };

  const handleConfirmNone = () => {
    if (noneWarningAction === "next") {
      setDirection(1);
      setStep(2);
    } else if (noneWarningAction === "queue") {
      setQueueOpen(true);
    }
    setNoneWarningAction(null);
  };

  // ─── Queue submit ───────────────────────────────────────────────────────────
  const handleQueueSubmit = async () => {
    setBtnLoading(true);
    try {
      await queueSchema.validate(queueValues, { abortEarly: false });

      const payload = {
        ...formValues,
        ...queueValues,
      };

      const { data } = await queueSurvey(payload);

      if (data.success) {
        dispatch(startLoading());
        setQueueOpen(false);
        navigate("/survey", { state: { tab: "queue" } });
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => {
          errs[e.path] = e.message;
        });
        setQueueErrors(errs);
      } else {
        handleFormError(err, setFormErrors, dispatch, navigate);
      }
    } finally {
      setBtnLoading(false);
    }
  };

  // ─── Final submit (step 2) ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      await step2Schema.validate(formValues, { abortEarly: false });

      let data;
      if (existingSurveyId) {
        // Completing a previously queued survey
        ({ data } = await completeSurvey(existingSurveyId, {
          purpose: formValues.purpose,
          agreementNo: formValues.agreementNo,
          contractor: formValues.contractor,
          instrumentNo: formValues.instrumentNo,
          instrumentModel: formValues.instrumentModel,
          reducedLevel: formValues.reducedLevel,
          backSight: formValues.backSight,
          remark: formValues.remark,
          chainageMultiple: formValues.chainageMultiple,
          separator: formValues.separator,
        }));
      } else {
        // Brand-new survey (all fields together)
        ({ data } = await createSurvey(formValues));
      }

      if (data.success) {
        const purposeId = data?.survey?.purposeId;
        dispatch(startLoading());
        navigate(`/survey/road-survey/${purposeId}/rows`);
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => {
          errs[e.path] = e.message;
        });
        setFormErrors(errs);
      } else {
        handleFormError(err, setFormErrors, dispatch, navigate);
      }
    } finally {
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!existingSurveyId) {
        dispatch(stopLoading());
        return;
      }

      try {
        const { data } = await getSurvey(existingSurveyId);
        const s = data?.survey;
        if (!s) return;

        // Detect which category was used when the survey was queued
        const loadedCategory =
          s.projectType === "None"
            ? "noneProject"
            : s.projectType === "Private" || s.consultant || s.client
              ? "privateProject"
              : s.department || s.division || s.section
                ? "publicProject"
                : "noneProject";
        setCategory(loadedCategory);

        setFormValues((prev) => ({
          ...prev,
          project: s.project || "",
          projectType:
            s.projectType ||
            (loadedCategory === "privateProject"
              ? "Private"
              : loadedCategory === "publicProject"
                ? "Public"
                : "None"),
          type: s.type || "Road Survey",
          purpose: s.purposes?.[0]?.type || "Initial Level",
          department: s.department || "",
          division: s.division || "",
          subDivision: s.subDivision || "",
          section: s.section || "",
          consultant: s.consultant || "",
          client: s.client || "",
          hasEquipment: s.hasEquipment ?? Boolean(s.instrumentNo || s.instrumentModel),
          instrumentModel: s.instrumentModel || "",
          instrumentNo: s.instrumentNo || "",
          hasTechnicalLead: s.hasTechnicalLead ?? Boolean(s.engineerSurveyor),
          engineerSurveyor: s.engineerSurveyor || "",
          assistant1: s.assistant1 || "",
          assistant2: s.assistant2 || "",
          assistant3: s.assistant3 || "",
          assistant4: s.assistant4 || "",
          assistant5: s.assistant5 || "",
        }));
      } catch (err) {
        handleFormError(err, null, dispatch, navigate);
      } finally {
        dispatch(stopLoading());
      }
    };

    load();
  }, [existingSurveyId]);

  // ─── Render a single field ──────────────────────────────────────────────────
  const renderField = (field, index) => {
    const { hidden, mode, size, ...input } = field;
    if (hidden) return null;
    const savedFields =
      commissioningDefaults?.[
        category === "publicProject" ? "Government" : "Corporate / Private"
      ] || {};
    const settingsField =
      commissioningOptionFields[category]?.[input.name] ||
      (input.name === "agreementNo" ? "Agreement No." : null);
    const savedOption = settingsField && savedFields[settingsField]?.trim();
    const options = savedOption ? [{ label: savedOption, value: savedOption }] : [];
    const isTypedSelect = Boolean(settingsField);
    return (
      <Grid size={{ xs: size || 12 }} key={index}>
        {input.name === "instrumentModel" ? (
          <Stack spacing={1}>
            <AdvancedAutoComplete
              {...input}
              options={[...new Set(instrumentRecords.map((item) => item?.model?.trim()).filter(Boolean))]
                .map((model) => ({ label: model, value: model }))}
              value={formValues.instrumentModel || ""}
              error={(formErrors && formErrors.instrumentModel) || ""}
              sx={{ width: "100%" }}
              onChange={handleInputChange}
            />
            {instrumentOptions.some((option) => option.value === formValues.instrumentNo) && (
              <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() => {
                setEditedInstrument({ ...instrumentRecords.find((item) => item.serial?.trim() === formValues.instrumentNo) });
                setInstrumentEditError("");
                setEditingInstrument(true);
              }}>
                Edit saved instrument
              </Button>
            )}
          </Stack>
        ) : input.name === "instrumentNo" ? (
          <AdvancedAutoComplete
            {...input}
            options={instrumentOptions.filter((option) =>
              !formValues.instrumentModel || instrumentRecords.some((item) =>
                item.serial?.trim() === option.value && item.model?.trim() === formValues.instrumentModel,
              ),
            )}
            value={formValues.instrumentNo || ""}
            error={(formErrors && formErrors.instrumentNo) || ""}
            sx={{ width: "100%" }}
            onChange={handleInputChange}
          />
        ) : mode === "toggle" ? (
          <Box
            component="label"
            display="inline-flex"
            alignItems="center"
            gap={0.5}
            sx={{ cursor: "pointer", alignSelf: "flex-start" }}
          >
            <Typography variant="body2" fontSize="14px" fontWeight={600} color="black">
              {input.label}
            </Typography>
            <Checkbox
              size="small"
              sx={{ p: 0.25 }}
              checked={Boolean(formValues[input.name])}
              onChange={(event) => {
                const checked = event.target.checked;
                setFormValues((current) => ({
                  ...current,
                  [input.name]: checked,
                  ...(input.name === "hasEquipment" && !checked ? { instrumentModel: "", instrumentNo: "" } : {}),
                  ...(input.name === "hasTechnicalLead" && !checked ? {
                    engineerSurveyor: "",
                    assistant1: "", assistant2: "", assistant3: "", assistant4: "", assistant5: "",
                  } : {}),
                }));
                setFormErrors(null);
              }}
              inputProps={{ "aria-label": input.label }}
            />
          </Box>
        ) : mode === "select" ? (
          <Stack spacing={1}>
            <BasicSelect
              {...input}
              value={formValues[input.name] || ""}
              error={(formErrors && formErrors[input.name]) || ""}
              sx={{ width: "100%" }}
              onChange={handleInputChange}
            />
            {input.name === "engineerSurveyor" && formValues.engineerSurveyor && staffDefaults && (
              <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() =>
                openSettingsEdit("staff", formValues.engineerSurveyor === "Engineer" ? "Engineer / Site In-Charge" : formValues.engineerSurveyor)
              }>
                Edit saved staff for this role
              </Button>
            )}
          </Stack>
        ) : mode === "solo-create" || isTypedSelect ? (
          <AdvancedAutoComplete
            {...input}
            options={isTypedSelect ? options : input.options}
            value={formValues[input.name] || ""}
            error={(formErrors && formErrors[input.name]) || ""}
            sx={{ width: "100%" }}
            onChange={handleInputChange}
          />
        ) : mode === "checkbox" ? (
          <Box>
            <Typography variant="body2" fontWeight={700} mb={0.25}>
              {input.label}
            </Typography>
            <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={2} rowGap={0.5}>
              {input.options?.map((option, idx) => (
                <Box component="label" display="flex" alignItems="center" gap={0.5} key={idx} sx={{ cursor: "pointer" }}>
                  <Typography
                    variant="body2"
                    fontSize="14px"
                    fontWeight={600}
                    color="black"
                  >
                    {option.label}
                  </Typography>
                  <Checkbox
                    size="small"
                    sx={{ p: 0.25 }}
                    inputProps={{ "aria-label": option.label }}
                    checked={category === option.name}
                    onChange={() => {
                      setCategory(option.name);
                      setFormValues((current) => ({
                        ...current,
                        projectType:
                          option.name === "noneProject"
                            ? "None"
                            : option.name === "publicProject"
                              ? "Public"
                              : "Private",
                        department: "",
                        division: "",
                        subDivision: "",
                        section: "",
                        consultant: "",
                        client: "",
                        contractor: "",
                        agreementNo: "",
                      }));
                      setFormErrors((prev) => ({ ...prev, category: null }));
                    }}
                  />
                </Box>
              ))}
            </Stack>
            {category !== "noneProject" && commissioningDefaults && (
              <Button size="small" onClick={() => openSettingsEdit(
                "commissioning",
                category === "publicProject" ? "Government" : "Corporate / Private",
              )}>
                Edit saved {category === "publicProject" ? "public" : "private"} project details
              </Button>
            )}
            {formErrors?.category && (
              <Typography variant="caption" color="error" mt={0.5}>
                {formErrors.category}
              </Typography>
            )}
          </Box>
        ) : (
          <BasicInput
            {...input}
            value={formValues[input.name] || ""}
            error={(formErrors && formErrors[input.name]) || ""}
            sx={{ width: "100%" }}
            onChange={handleInputChange}
          />
        )}
      </Grid>
    );
  };

  // ─── Queue modal content ────────────────────────────────────────────────────
  const queueModalContent = (
    <Stack spacing={2} mt={2}>
      <BasicInput
        label="Proposal Schedule Date*"
        name="proposalScheduleDate"
        type="date"
        value={queueValues.proposalScheduleDate}
        error={queueErrors?.proposalScheduleDate || ""}
        onChange={handleQueueChange}
        sx={{ width: "100%" }}
        InputLabelProps={{ shrink: true }}
      />
      <BasicInput
        label="Proposal Deadline*"
        name="proposalDeadline"
        type="date"
        value={queueValues.proposalDeadline}
        error={queueErrors?.proposalDeadline || ""}
        onChange={handleQueueChange}
        sx={{ width: "100%" }}
        InputLabelProps={{ shrink: true }}
      />
      <BasicInput
        label="Location*"
        name="location"
        type="text"
        value={queueValues.location}
        error={queueErrors?.location || ""}
        onChange={handleQueueChange}
        sx={{ width: "100%" }}
      />
      <Divider sx={{ my: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Optional
        </Typography>
      </Divider>
      <BasicInput
        label="Final Schedule Date"
        name="finalScheduleDate"
        type="date"
        value={queueValues.finalScheduleDate}
        error=""
        onChange={handleQueueChange}
        sx={{ width: "100%" }}
        InputLabelProps={{ shrink: true }}
      />
      <BasicInput
        label="Final Deadline"
        name="finalDeadline"
        type="date"
        value={queueValues.finalDeadline}
        error=""
        onChange={handleQueueChange}
        sx={{ width: "100%" }}
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );

  return (
    <Box
      sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: { xs: 10, md: 14 } }}
    >
      <SmallHeader />

      <AlertDialogSlide
        title="Continue without project details?"
        description="The plotting report won't show public or private project details. Are you sure you want to continue?"
        cancelButtonText="Cancel"
        submitButtonText="Continue"
        open={Boolean(noneWarningAction)}
        onCancel={() => setNoneWarningAction(null)}
        onSubmit={handleConfirmNone}
      />

      <AlertDialogSlide
        title="Edit saved instrument"
        content={
          <Stack spacing={2} mt={1}>
            <Alert
              severity="warning"
              variant="outlined"
              sx={{ borderRadius: 2, minWidth: 0, maxWidth: "100%", boxSizing: "border-box", "& .MuiAlert-message": { minWidth: 0, overflowWrap: "anywhere" } }}
            >
              Saving changes will update this instrument in Settings and affect future projects.
            </Alert>
            <TextField fullWidth size="small" label="Instrument type" value={editedInstrument?.type || "Auto Level Readings (Degree)"} disabled />
            <TextField
              fullWidth size="small" autoFocus label="Instrument model*"
              value={editedInstrument?.model || ""}
              onChange={(event) => {
                setEditedInstrument((current) => ({ ...current, model: event.target.value }));
                setInstrumentEditError("");
              }}
            />
            <TextField
              fullWidth size="small" label="Instrument number*"
              value={editedInstrument?.serial || ""}
              onChange={(event) => {
                setEditedInstrument((current) => ({ ...current, serial: event.target.value }));
                setInstrumentEditError("");
              }}
            />
            <TextField
              fullWidth size="small" type="date" label="Date of purchase"
              slotProps={{ inputLabel: { shrink: true } }}
              value={editedInstrument?.purchaseDate || ""}
              onChange={(event) => setEditedInstrument((current) => ({ ...current, purchaseDate: event.target.value }))}
            />
            <TextField
              fullWidth size="small" type="date" label="Last calibration date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={editedInstrument?.calibrationDate || ""}
              onChange={(event) => setEditedInstrument((current) => ({ ...current, calibrationDate: event.target.value }))}
            />
            {instrumentEditError && <Typography variant="body2" color="error">{instrumentEditError}</Typography>}
          </Stack>
        }
        cancelButtonText="Cancel"
        submitButtonText={savingInstrument ? "Saving..." : "Save to Settings"}
        submitDisabled={savingInstrument}
        open={editingInstrument}
        onCancel={() => {
          setEditingInstrument(false);
          setEditedInstrument(null);
          setInstrumentEditError("");
        }}
        onSubmit={handleSaveInstrument}
      />

      <AlertDialogSlide
        title={settingsEdit?.section === "staff" ? `Edit ${settingsEdit.group} staff` : `Edit ${settingsEdit?.group || ""} project details`}
        description="Warning: Saving these changes will replace the saved values in Settings. The updated values will appear in future projects."
        content={settingsEdit && (
          <Stack spacing={2} mt={2}>
            {Object.entries(settingsEdit.values).map(([field, value]) => (
              <TextField
                key={field}
                fullWidth
                size="small"
                label={field}
                value={value}
                onChange={(event) => {
                  setSettingsEdit((current) => ({
                    ...current,
                    values: { ...current.values, [field]: event.target.value },
                  }));
                  setSettingsEditError("");
                }}
              />
            ))}
            {settingsEditError && <Typography variant="body2" color="error">{settingsEditError}</Typography>}
          </Stack>
        )}
        cancelButtonText="Cancel"
        submitButtonText={savingSettingsEdit ? "Saving..." : "Save to Settings"}
        submitDisabled={savingSettingsEdit}
        open={Boolean(settingsEdit)}
        onCancel={() => {
          setSettingsEdit(null);
          setSettingsEditError("");
        }}
        onSubmit={handleSaveSettingsEdit}
      />

      {/* Queue Modal */}
      <AlertDialogSlide
        title="Queue Project"
        description={`Schedule "${formValues.project || "this project"}" for later`}
        content={queueModalContent}
        cancelButtonText="Cancel"
        submitButtonText={btnLoading ? "Saving..." : "Queue"}
        open={queueOpen}
        onCancel={() => setQueueOpen(false)}
        onSubmit={handleQueueSubmit}
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
          {/* Gradient top bar */}
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

          {/* Header */}
          <Stack direction="row" alignItems="center" mb={4} mt={1}>
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
                {existingSurveyId
                  ? "Complete Your Project"
                  : "Create New Project"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                mt={0.5}
              >
                {step === 1
                  ? "Step 1 of 2 — Project details & team"
                  : "Step 2 of 2 — Technical parameters"}
              </Typography>
            </Box>
          </Stack>

          {/* Stepper */}
          <Stepper
            activeStep={step - 1}
            sx={{
              mb: 4,
              "& .MuiStepLabel-label": { fontWeight: 700, fontSize: "0.85rem" },
              "& .MuiStepIcon-root.Mui-active": { color: "#4f46e5" },
              "& .MuiStepIcon-root.Mui-completed": { color: "#0ea5e9" },
            }}
          >
            <Step>
              <StepLabel>Project Info & Team</StepLabel>
            </Step>
            <Step>
              <StepLabel>Technical Parameters</StepLabel>
            </Step>
          </Stepper>

          {/* Animated form body */}
          <Box sx={{ overflow: "hidden", position: "relative" }}>
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 ? (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <Grid container rowSpacing={2} columnSpacing={3} columns={12} alignItems="start">
                    {visibleStep1Fields.map((field, idx) =>
                      renderField(field, idx),
                    )}
                  </Grid>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <Grid container spacing={3} columns={12} alignItems="end">
                    {step2Fields.map((field, idx) => renderField(field, idx))}
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Floating action bar */}
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
                overflowX: "auto",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="btns-step1"
                    style={{ display: "flex", gap: 8, height: "100%" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {[
                      {
                        label: "QUEUE",
                        icon: <CgGoogleTasks fontSize="20px" />,
                        onClick: handleOpenQueue,
                        queue: true,
                      },
                      {
                        label: "NEXT",
                        icon: <FaLocationArrow fontSize="20px" />,
                        onClick: handleNext,
                      },
                    ].map((btn, i) => (
                      <ActionBtn key={i} {...btn} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="btns-step2"
                    style={{ display: "flex", gap: 8, height: "100%" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {[
                      {
                        label: "BACK",
                        icon: <IoIosArrowBack fontSize="20px" />,
                        onClick: handleBack,
                        muted: true,
                      },
                      {
                        label: btnLoading ? "..." : "SUBMIT",
                        icon: <FaLocationArrow fontSize="20px" />,
                        onClick: handleSubmit,
                      },
                    ].map((btn, i) => (
                      <ActionBtn key={i} {...btn} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Paper>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

// ─── Small reusable action button ────────────────────────────────────────────
const ActionBtn = ({ label, icon, onClick, muted, queue }) => (
  <Box
    onClick={onClick}
    sx={{
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
      bgcolor: muted ? "rgba(255,255,255,0.6)" : queue ? "white" : "white",
      color: muted ? "#64748b" : queue ? "#ea580c" : "#6366f1",
      transition: "all 0.3s ease",
      "&:hover": {
        bgcolor: muted ? "#e2e8f0" : queue ? "#ea580c" : "#6366f1",
        color: muted ? "#1e293b" : "white",
      },
    }}
  >
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
          color: "inherit",
          display: "flex",
          alignItems: "center",
          transition: "color 0.3s ease",
        }}
      >
        {icon}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={900}
        letterSpacing="0.05em"
        sx={{
          lineHeight: 1,
          color: "inherit",
          fontSize: { xs: "0.8rem", md: "1rem" },
          transition: "color 0.3s ease",
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

export default RoadSurveyForm;
