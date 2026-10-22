import { createHmac, randomInt } from "node:crypto";

export const normalizePhone = (value) => {
  if (typeof value !== "string") return null;
  const phone = value.trim().replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
};

export const generateEmailCode = () => String(randomInt(100000, 1000000));

export const hashEmailCode = (userId, email, code) => {
  if (!process.env.JWT_SECRET) throw new Error("Verification is not configured");
  return createHmac("sha256", process.env.JWT_SECRET)
    .update(JSON.stringify([String(userId), email, code])).digest("hex");
};
