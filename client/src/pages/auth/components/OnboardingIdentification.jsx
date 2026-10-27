import { useState } from "react";
import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { identificationFields } from "../../../constants/onboarding";
import { fetchOnboardingGst } from "../../../services/indexServices";

export default function OnboardingIdentification({ type, details, onChange }) {
  const [gstBusy, setGstBusy] = useState(false);
  const [gstError, setGstError] = useState("");
  const fields = identificationFields(type, details);
  const gstVerified = Boolean(details.gstin && details.verifiedGstin === details.gstin);
  const update = (name, value) => {
    if (name === "commissionProfile") {
      for (const key of ["entityType", "entityTypeCustom", "designation", "designationCustom"]) onChange(key, "");
    }
    if (name === "gstin") {
      value = value.toUpperCase().replace(/\s/g, "");
      onChange("verifiedGstin", "");
      onChange("officialAddress", "");
      setGstError("");
    }
    if (["courseProgram", "entityType", "designation"].includes(name)) onChange(`${name}Custom`, "");
    onChange(name, value);
  };
  const fetchGst = async () => {
    setGstBusy(true); setGstError("");
    try {
      const { data } = await fetchOnboardingGst(details.gstin || "");
      onChange("gstin", data.gstin);
      onChange("verifiedGstin", data.gstin);
      if (data.gstin) {
        onChange("officialName", data.gstBusinessName);
        onChange("officialAddress", data.gstBusinessAddress);
      } else onChange("officialAddress", "");
    } catch (error) { setGstError(error.response?.data?.message || "GST details could not be verified. Please try again."); }
    finally { setGstBusy(false); }
  };
  return <Stack spacing={2.5} sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
    <Typography variant="h6" fontWeight={800} color="#1e1b4b">
      {type === "Student" ? "Academic Identification" : type === "Professional" ? "Professional Identification" : "Enterprise Identification"}
    </Typography>
    {fields.map(field => <Stack key={field.name} spacing={1}>
      <TextField fullWidth required={!field.optional} label={field.label} select={Boolean(field.options)}
        type={field.options ? undefined : field.inputType} value={details[field.name] ?? ""}
        disabled={gstBusy || (field.name === "entityType" || field.name === "designation") && !details.commissionProfile}
        onChange={event => update(field.name, event.target.value)}
        slotProps={{ input: { readOnly: Boolean(details.gstin && ["officialName", "officialAddress"].includes(field.name)) },
          htmlInput: field.name === "gstin" ? { maxLength: 15 } : field.inputType === "number" ? { min: field.name === "graduationYear" ? 1900 : 1, step: 1 } : { maxLength: field.name === "officialAddress" ? 1200 : 200 } }}
        multiline={field.name === "officialAddress"} minRows={field.name === "officialAddress" ? 2 : undefined}
        helperText={field.name === "gstin" ? type === "Company" ? "Required. Fetch your registered name and address before continuing." : "Optional. Fetch your registered name and address if providing GSTIN."
          : field.name === "website" ? "Optional. Include https://" : field.name === "officialName" && details.gstin ? "Fetched from GST records." : undefined}>
        {field.options?.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
      </TextField>
      {field.name === "gstin" && <>
        <Button variant="outlined" onClick={fetchGst} disabled={gstBusy || !details.gstin || details.gstin.length !== 15}
          sx={{ alignSelf: "flex-start", textTransform: "none", borderRadius: 2 }}>
          {gstBusy ? "Verifying..." : gstVerified ? "Refresh GST details" : "Fetch GST details"}
        </Button>
        {gstVerified && <Alert severity="success">Registered name and address verified.</Alert>}
        {gstError && <Alert severity="error">{gstError}</Alert>}
      </>}
    </Stack>)}
  </Stack>;
}
