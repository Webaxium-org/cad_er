import createHttpError from "http-errors";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const states = new Set("01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 26 27 29 30 31 32 33 34 35 36 37 38".split(" "));
export const validGstin = value => {
  if (typeof value !== "string" || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value) || !states.has(value.slice(0, 2))) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = alphabet.indexOf(value[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(product / 36) + product % 36;
  }
  return alphabet[(36 - sum % 36) % 36] === value[14];
};
export const validateGstProfile = input => {
  if (!input || typeof input.gstin !== "string") throw createHttpError(400, "Enter GSTIN as text");
  const gstin = input.gstin.trim().toUpperCase();
  if (gstin && !validGstin(gstin)) throw createHttpError(400, "Enter a valid 15-character GSTIN, including its check digit");
  return { gstin };
};
export const invoiceRecipient = user => ({
  name: user.gstin && user.gstBusinessName ? user.gstBusinessName : user.name,
  accountName: user.name,
  email: user.email,
  gstin: user.gstin || "",
  address: user.gstin ? user.gstBusinessAddress || "" : "",
  mobile: user.gstin ? user.gstMobile || "" : "",
});
