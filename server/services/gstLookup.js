import createHttpError from "http-errors";
import { validGstin } from "./gstIdentity.js";

export const GST_PROVIDER = "gstinapi.in";
export const gstLookupConfigured = () => Boolean(process.env.GSTIN_API_KEY?.trim());
const inflight = new Map();
const readText = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

export const normalizeGstLookup = (result, gstin) => {
  const data = result?.data;
  if (result?.success !== true || data?.gstin !== gstin || (result.gstin && result.gstin !== gstin)) throw createHttpError(502, "GST lookup returned an invalid result. Please try again");
  if (typeof data.status !== "string" || data.status.toLowerCase() !== "active") throw createHttpError(400, "This GSTIN is not active. Your saved details have not been changed");
  const gstBusinessName = readText(data.legal_name, 160);
  const address = readText(data.address, 800);
  if (!gstBusinessName || !address) throw createHttpError(502, "GST lookup did not return the firm name and address. Your saved details have not been changed");
  const parts = [address];
  for (const value of [data.city, data.address_details?.state, data.pincode]) {
    const part = readText(value, 100);
    if (part && !parts.join(", ").toLowerCase().includes(part.toLowerCase())) parts.push(part);
  }
  return { gstin, gstBusinessName, gstBusinessAddress: parts.join(", "),
    // Basic verification has no documented mobile field. Never substitute the
    // account phone and present it as a fetched registered business contact.
    gstMobile: "", gstFetchedAt: new Date(), gstLookupProvider: GST_PROVIDER };
};

const requestLookup = async gstin => {
  let response;
  try {
    response = await fetch(`https://www.gstinapi.in/v1/gstin/${encodeURIComponent(gstin)}`, {
      headers: { "x-api-key": process.env.GSTIN_API_KEY.trim(), Accept: "application/json" },
      signal: AbortSignal.timeout(10000), redirect: "error",
    });
  } catch { throw createHttpError(502, "GST lookup is temporarily unavailable. Please try again later"); }
  if ([401, 403].includes(response.status)) throw createHttpError(503, "GST lookup is unavailable. Please contact support");
  if (response.status === 402) throw createHttpError(503, "GST lookup allowance has been exhausted. Please contact support");
  if (response.status === 404) throw createHttpError(400, "GSTIN was not found. Check the number and try again");
  if (response.status === 429) throw createHttpError(429, "GST lookup is busy. Please wait a minute and try again");
  if (response.status === 400) throw createHttpError(400, "The GST provider could not verify this GSTIN. Check the number");
  if (!response.ok) throw createHttpError(502, "GST lookup is temporarily unavailable. Please try again later");
  let result;
  try { result = await response.json(); } catch { throw createHttpError(502, "GST lookup returned an unreadable response. Please try again"); }
  return normalizeGstLookup(result, gstin);
};
export const fetchGstDetails = async gstin => {
  if (!validGstin(gstin)) throw createHttpError(400, "Enter a valid GSTIN");
  if (!gstLookupConfigured()) throw createHttpError(503, "GST lookup is not available yet. Please contact support");
  if (inflight.has(gstin)) return inflight.get(gstin);
  const pending = requestLookup(gstin);
  inflight.set(gstin, pending);
  try { return await pending; } finally { inflight.delete(gstin); }
};
