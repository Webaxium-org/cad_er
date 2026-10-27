import test from "node:test";
import assert from "node:assert/strict";
import { validateOnboardingDetails } from "../services/onboardingDetails.js";
import { identificationFields, identificationErrors } from "../utils/onboardingOptions.js";
import { identificationFields as browserFields, identificationErrors as browserErrors } from "../../client/src/constants/onboarding.js";
import User from "../models/user.js";

const student = { instituteName: "Test Institute", location: "Kochi", universityBoard: "Test University",
  courseProgram: "ITI Civil", studentId: "STU-001", graduationYear: "2027" };
const professional = { enterpriseName: "Test Enterprise", commissionProfile: "Municipal", entityType: "Irrigation",
  designation: "Assistant Engineer", officialName: "Test User", primaryProjectType: "Road Way", preferredEquipment: "Auto level", device: "Laptop/ PC" };
const gstUser = { gstin: "32CZBPM1659R1ZW", gstBusinessName: "Registered Firm", gstBusinessAddress: "Registered Address, Kerala", gstFetchedAt: new Date() };
const company = { ...professional, commissionProfile: "Commercial", entityType: "LLP", gstin: gstUser.gstin,
  officialAddress: "Browser address", website: "https://example.com", numberOfUsers: "12" };

test("academic identification accepts all fields and saves numeric year and custom program", () => {
  const details = validateOnboardingDetails("Student", student, {});
  assert.equal(details.graduationYear, 2027);
  assert.equal(details.qualification, "ITI Civil");
  const custom = validateOnboardingDetails("Student", { ...student, courseProgram: "Custom", courseProgramCustom: "  Diploma in Surveying  " }, {});
  assert.equal(custom.qualification, "Diploma in Surveying");
  for (const key of Object.keys(student)) {
    assert.throws(() => validateOnboardingDetails("Student", { ...student, [key]: "" }, {}), { status: 400 });
  }
  assert.throws(() => validateOnboardingDetails("Student", { ...student, courseProgram: "Custom" }, {}), { status: 400 });
});
test("professional profile options are conditional and custom values are required", () => {
  assert.equal(validateOnboardingDetails("Professional", professional, {}).jobTitle, "Assistant Engineer");
  const educational = { ...professional, commissionProfile: "Educational", entityType: "College", designation: "Academic faculty" };
  assert.equal(validateOnboardingDetails("Professional", educational, {}).industry, "Educational");
  assert.throws(() => validateOnboardingDetails("Professional", { ...professional, commissionProfile: "Commercial" }, {}), { status: 400 });
  assert.throws(() => validateOnboardingDetails("Professional", { ...professional, designation: "Custom" }, {}), { status: 400 });
  const custom = validateOnboardingDetails("Professional", { ...professional, entityType: "Custom", entityTypeCustom: "Municipal Office", designation: "Custom", designationCustom: "Executive Engineer" }, {});
  assert.equal(custom.jobTitle, "Executive Engineer");
  assert.equal(custom.entityTypeCustom, "Municipal Office");
});
test("GST is optional for professionals but supplied GST requires verified server records", () => {
  validateOnboardingDetails("Professional", professional, {});
  assert.throws(() => validateOnboardingDetails("Professional", { ...professional, gstin: gstUser.gstin, officialAddress: "Fake" }, {}), { status: 400 });
  const result = validateOnboardingDetails("Professional", { ...professional, gstin: gstUser.gstin, officialName: "Fake", officialAddress: "Fake" }, gstUser);
  assert.equal(result.officialName, gstUser.gstBusinessName);
  assert.equal(result.officialAddress, gstUser.gstBusinessAddress);
});
test("enterprise requires GST and user count, validates website and excludes municipal profile", () => {
  const result = validateOnboardingDetails("Company", company, gstUser);
  assert.equal(result.numberOfUsers, 12);
  assert.equal(result.size, "12");
  assert.equal(result.companyName, company.enterpriseName);
  assert.equal(result.officialName, gstUser.gstBusinessName);
  for (const changes of [{ gstin: "" }, { numberOfUsers: "0" }, { numberOfUsers: "1.5" },
    { website: "javascript:alert(1)" }, { commissionProfile: "Municipal" }]) {
    assert.throws(() => validateOnboardingDetails("Company", { ...company, ...changes }, gstUser), { status: 400 });
  }
  validateOnboardingDetails("Company", { ...company, website: "" }, gstUser);
});
test("all identification fields survive the user schema without allowing role or stale custom values", async () => {
  const details = validateOnboardingDetails("Professional", { ...professional, role: "Super Admin", designationCustom: "Forged" }, {});
  assert.equal(details.role, undefined);
  assert.equal(details.designationCustom, undefined);
  const user = new User({ name: "Test", email: "test@example.com", password: "hash", details });
  await user.validate();
  assert.equal(user.details.commissionProfile, "Municipal");
  assert.equal(user.details.primaryProjectType, "Road Way");
  assert.equal(user.details.device, "Laptop/ PC");
});
test("browser and server definitions agree for all account and profile combinations", () => {
  for (const type of ["Student", "Professional", "Company"]) {
    for (const commissionProfile of ["Municipal", "Commercial", "Educational"]) {
      const input = { ...student, ...company, commissionProfile, courseProgram: "Custom", designation: "Custom", entityType: "Custom" };
      assert.deepEqual(browserFields(type, input), identificationFields(type, input));
      assert.deepEqual(browserErrors(type, input), identificationErrors(type, input));
    }
  }
});
