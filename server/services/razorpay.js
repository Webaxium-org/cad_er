import crypto from "node:crypto";
import createHttpError from "http-errors";

const credentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw createHttpError(503, "Payments are not configured");
  return { keyId, keySecret };
};

export const razorpayRequest = async (method, path, body) => {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok) throw createHttpError(502, result.error?.description || "Razorpay request failed");
  return result;
};

export const getCheckoutKey = () => credentials().keyId;

export const verifyHmac = (message, signature, secret) => {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
};

export const verifyCheckoutSignature = (subscriptionId, paymentId, signature) =>
  verifyHmac(`${paymentId}|${subscriptionId}`, signature, credentials().keySecret);

export const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw createHttpError(503, "Webhook is not configured");
  return verifyHmac(rawBody, signature, secret);
};
