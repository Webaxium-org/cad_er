import createHttpError from "http-errors";
import { parseChainage } from "./longitudinalChainage.js";

export const proposalLengthRows = (rows, form, separator = "/") => {
  if (form.length !== "Custom") return rows;
  const { from, to } = form.chainageRange || {};
  const stations = rows.filter(row => row.type === "Chainage");
  if (!stations.some(row => row.chainage === from) || !stations.some(row => row.chainage === to))
    throw createHttpError(400, "Select existing From and To chainages for custom length.");
  const start = parseChainage(from, separator), end = parseChainage(to, separator);
  if (end <= start) throw createHttpError(400, "To chainage must be after From chainage.");
  return rows.filter(row => {
    if (!row.chainage) return false;
    const value = parseChainage(row.chainage, separator);
    return value >= start && value <= end;
  });
};
