const fail = (message, statusCode = 503) => Object.assign(new Error(message), { statusCode });

const widgetRequest = async (action, body) => {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey || !process.env.MSG91_WIDGET_ID) throw fail("SMS verification is not configured");
  let response;
  let result;
  try {
    response = await fetch("https://control.msg91.com/api/v5/widget/" + action, {
      method: "POST",
      headers: { authkey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ authkey, ...body }),
      signal: AbortSignal.timeout(10000),
    });
    result = await response.json();
  } catch {
    throw fail("SMS verification service is unavailable. Please try again shortly.");
  }
  if (!response.ok || result?.type !== "success") {
    // Do not expose credentials, tokens, or provider responses in errors.
    if (action === "verifyOtp" || action === "verifyAccessToken") {
      throw fail("Incorrect or expired verification code. Please try again or request a new code.", 400);
    }
    throw fail("Could not send the SMS verification code. Please try again shortly.");
  }
  return result;
};

export const sendWidgetCode = async (phone) => {
  const result = await widgetRequest("sendOtp", {
    widgetId: process.env.MSG91_WIDGET_ID, identifier: phone.slice(1),
  });
  if (typeof result.message !== "string" || !result.message) {
    throw fail("SMS verification service returned an invalid request ID");
  }
  return result.message;
};

export const verifyWidgetCode = async (requestId, code, phone) => {
  const result = await widgetRequest("verifyOtp", {
    widgetId: process.env.MSG91_WIDGET_ID, reqId: requestId, otp: code,
  });
  if (typeof result.message !== "string" || !result.message) throw fail("SMS verification service returned an invalid token");
  const verified = await widgetRequest("verifyAccessToken", { "access-token": result.message });
  // Only the identifier returned by MSG91's authenticated validation is trusted.
  if (verified.message !== phone.slice(1)) throw fail("Phone verification does not match this number", 400);
};
