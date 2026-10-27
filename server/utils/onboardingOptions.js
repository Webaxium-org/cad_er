export const COURSE_PROGRAMS = ["ITI Civil", "ITI Survey", "Polytechnic Civil", "BE/ B-Tech Civil", "Custom"];
export const ENTITY_TYPES = {
  Municipal: ["Irrigation", "Water Authority", "PWD Roads", "Custom"],
  Commercial: ["Proprietary", "Partnership", "LLP", "Private LTD", "Public LTD", "Custom"],
  Educational: ["University", "College", "Institute"],
};
export const DESIGNATIONS = {
  Municipal: ["Overseer", "Assistant Engineer", "Asst. Executive Engineer", "Custom"],
  Commercial: ["Surveyor", "Site Engineer", "Project Manager", "Consultant", "Business Owner", "Custom"],
  Educational: ["Academic faculty", "Custom"],
};
export const PROJECT_TYPES = ["Road Way", "Water Way", "Rail Way"];
export const DEVICES = ["Laptop/ PC", "Android Tablet", "Android Mobile", "iPad", "iPhone"];

export const identificationFields = (type, details = {}) => {
  const field = (name, label, options, optional = false, inputType = "text") => ({ name, label, options, optional, inputType });
  const custom = (name, label, options) => [field(name, label, options),
    ...(details[name] === "Custom" ? [field(name + "Custom", "Custom " + label.toLowerCase())] : [])];
  if (type === "Student") return [field("instituteName", "Institution"), field("location", "Location"),
    field("universityBoard", "University / Board"), ...custom("courseProgram", "Course / Program", COURSE_PROGRAMS),
    field("studentId", "Student ID / Roll Number"), field("graduationYear", "Graduation year", null, false, "number")];
  if (!["Professional", "Company"].includes(type)) return [];
  return [field("enterpriseName", "Enterprise / Institution"),
    field("commissionProfile", "Commission Profile", type === "Company" ? ["Commercial", "Educational"] : ["Municipal", "Commercial", "Educational"]),
    ...custom("entityType", "Type of Entity", ENTITY_TYPES[details.commissionProfile] || []),
    ...(type === "Professional" ? custom("designation", "Designation", DESIGNATIONS[details.commissionProfile] || []) : []),
    field("gstin", "GSTIN", null, type === "Professional"),
    field("officialName", type === "Company" ? "Official Name" : "Name"),
    ...(type === "Company" || details.gstin ? [field("officialAddress", type === "Company" ? "Official Address" : "Address")] : []),
    ...(type === "Company" ? [field("website", "Website", null, true, "url")] : []),
    field("primaryProjectType", "Primary project type", PROJECT_TYPES), field("preferredEquipment", "Preferred equipment", ["Auto level"]),
    field("device", "Device", DEVICES),
    ...(type === "Company" ? [field("numberOfUsers", "No. of Users", null, false, "number")] : [])];
};

export const identificationErrors = (type, details = {}) => {
  const errors = {};
  if (!["Student", "Professional", "Company"].includes(type)) return { type: "Select an account type" };
  for (const field of identificationFields(type, details)) {
    const value = details[field.name];
    const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    if (!text) { if (!field.optional) errors[field.name] = field.label + " is required"; continue; }
    if (text.length > (field.name === "officialAddress" ? 1200 : 200)) errors[field.name] = field.label + " is too long";
    else if (field.options && !field.options.includes(value)) errors[field.name] = "Select a valid " + field.label.toLowerCase();
    else if (field.name === "graduationYear" && (!/^\d{4}$/.test(text) || Number(text) < 1900 || Number(text) > new Date().getFullYear() + 20)) errors[field.name] = "Enter a valid graduation year";
    else if (field.name === "numberOfUsers" && (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 1000000)) errors[field.name] = "Enter between 1 and 1,000,000 users";
    else if (field.name === "gstin" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(text)) errors[field.name] = "Enter a valid 15-character GSTIN";
    else if (field.name === "website") {
      try { const url = new URL(text); if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw Error(); }
      catch { errors[field.name] = "Enter a valid http:// or https:// website URL"; }
    }
  }
  return errors;
};
