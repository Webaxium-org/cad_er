import createHttpError from "http-errors";
import { identificationErrors, identificationFields } from "../utils/onboardingOptions.js";
import { validGstin } from "./gstIdentity.js";

export const validateOnboardingDetails = (type, input, user) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw createHttpError(400, "Complete your identification details");
  const details = {};
  for (const field of identificationFields(type, input)) {
    const value = input[field.name];
    if (typeof value === "string" || typeof value === "number") details[field.name] = String(value).trim();
  }
  if (details.gstin) {
    details.gstin = details.gstin.toUpperCase();
    if (!validGstin(details.gstin)) throw createHttpError(400, "Enter a valid GSTIN, including its check digit");
    if (details.gstin !== user.gstin || !user.gstFetchedAt || !user.gstBusinessName || !user.gstBusinessAddress) {
      throw createHttpError(400, "Fetch and verify your GST details before completing setup");
    }
    // Registered firm details come from the server lookup, never browser text.
    details.officialName = user.gstBusinessName;
    details.officialAddress = user.gstBusinessAddress;
  }
  const errors = identificationErrors(type, details);
  if (Object.keys(errors).length) throw createHttpError(400, Object.values(errors)[0]);
  if (type === "Student") {
    details.graduationYear = Number(details.graduationYear);
    details.qualification = details.courseProgram === "Custom" ? details.courseProgramCustom : details.courseProgram;
  }
  if (type === "Professional") {
    details.jobTitle = details.designation === "Custom" ? details.designationCustom : details.designation;
    details.industry = details.commissionProfile;
  }
  if (type === "Company") {
    details.numberOfUsers = Number(details.numberOfUsers);
    details.companyName = details.enterpriseName;
    details.size = String(details.numberOfUsers);
  }
  return details;
};
