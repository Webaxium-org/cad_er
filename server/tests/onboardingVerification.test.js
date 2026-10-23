import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/user.js";
import Verification from "../models/onboardingVerification.js";
import { normalizePhone } from "../utils/onboardingVerification.js";
import { sendOnboardingCode, verifyOnboardingCode } from "../controllers/onboardingVerificationController.js";
import { registerAccountType } from "../controllers/indexController.js";
import { sendWidgetCode, verifyWidgetCode } from "../utils/msg91.js";

const configureWidget = (t) => {
  const original = { MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY, MSG91_WIDGET_ID: process.env.MSG91_WIDGET_ID };
  process.env.MSG91_AUTH_KEY = "test-key";
  process.env.MSG91_WIDGET_ID = "test-widget";
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
};

test("phone numbers require a country code and valid length", () => {
  assert.equal(normalizePhone("+91 (98765) 43210"), "+919876543210");
  for (const value of [null, 123, "", "9876543210", "+0123456789", "+123", "+1234567890123456", "+91abc9876543210"]) {
    assert.equal(normalizePhone(value), null);
  }
});

test("SMS verification rejects invalid, expired and exhausted codes, and accepts a valid code", async (t) => {
  configureWidget(t);
  const user = { _id: "user-a", email: "a@example.com" };
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => user);
  const req = { user: { isAuthenticated: true, userId: user._id }, body: { phone: "+919876543210", code: "123456" } };
  let response;
  let failure;
  const res = { json: (data) => { response = data; } };
  const next = (error) => { failure = error; };
  let challenge = null;
  t.mock.method(Verification, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.attempts.$lt, 5);
    assert.ok(filter.expiresAt.$gt instanceof Date);
    assert.equal(filter.verifiedAt, null);
    assert.equal(update.$inc.attempts, 1);
    return challenge;
  });
  const save = t.mock.method(Verification, "updateOne", async () => ({ modifiedCount: 1 }));
  await verifyOnboardingCode(req, res, next);
  assert.match(failure.message, /expired or attempt limit/);
  challenge = { _id: "challenge", challengeId: "local-id", providerRequestId: "provider-id" };
  let correct = false;
  t.mock.method(globalThis, "fetch", async (url) => ({ ok: true, json: async () => {
    if (!correct) return { type: "error" };
    return { type: "success", message: url.endsWith("verifyOtp") ? "provider-access-token" : "919876543210" };
  } }));
  await verifyOnboardingCode(req, res, next);
  assert.match(failure.message, /Incorrect/);
  assert.equal(save.mock.callCount(), 0);
  correct = true;
  failure = null;
  await verifyOnboardingCode(req, res, next);
  assert.equal(failure, null);
  assert.equal(response.success, true);
  assert.equal(save.mock.callCount(), 1);
  req.body.code = "abc";
  await verifyOnboardingCode(req, res, next);
  assert.match(failure.message, /six-digit/);
  req.user.isAuthenticated = false;
  await verifyOnboardingCode(req, res, next);
  assert.equal(failure.statusCode, 401);
});

test("account setup rejects missing phone and unverified phone", async (t) => {
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => ({ email: "a@example.com" }));
  t.mock.method(Verification, "findOne", async (filter) => {
    assert.equal(filter.phone, "+919876543210");
    assert.deepEqual(filter.verifiedAt, { $ne: null });
    assert.deepEqual(filter.providerRequestId, { $type: "string" });
    assert.ok(filter.expiresAt.$gt instanceof Date);
    return null;
  });
  const req = { user: { userId: "user-a", isAuthenticated: true }, body: { type: "Student", details: {} } };
  let failure;
  await registerAccountType(req, {}, (error) => { failure = error; });
  assert.match(failure.message, /phone number/);
  req.body.phone = "+919876543210";
  await registerAccountType(req, {}, (error) => { failure = error; });
  assert.match(failure.message, /Verify your phone number/);
});

test("resend cooldown rejects concurrent requests before sending SMS", async (t) => {
  process.env.JWT_SECRET ||= "test-only-secret";
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => ({ _id: "user-a", email: "a@example.com" }));
  t.mock.method(Verification, "findOneAndUpdate", async (filter, update) => {
    assert.ok(filter.nextSendAt.$lte instanceof Date);
    assert.equal(update.$set.attempts, 0);
    assert.equal(update.$set.nextSendAt - filter.nextSendAt.$lte, 60000);
    assert.equal(update.$set.expiresAt - filter.nextSendAt.$lte, 600000);
    assert.equal(update.$unset.verifiedAt, 1);
    throw Object.assign(new Error("Duplicate key"), { code: 11000 });
  });
  let failure;
  await sendOnboardingCode({ user: { isAuthenticated: true, userId: "user-a" }, body: { phone: "+919876543210" } }, {}, (error) => { failure = error; });
  assert.equal(failure.statusCode, 429);
});

test("setup saves the verified phone and verification timestamp", async (t) => {
  let saved = false;
  const user = {
    _id: "user-a", email: "a@example.com",
    save: async () => { saved = true; },
    toObject: () => ({ phone: user.phone, phoneVerifiedAt: user.phoneVerifiedAt, type: user.type, password: "private" }),
  };
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => user);
  t.mock.method(Verification, "findOne", async (filter) => {
    assert.equal(filter.phone, "+919876543210");
    return { verifiedAt: new Date("2026-01-01") };
  });
  let response;
  let failure;
  const res = { status: () => res, json: (data) => { response = data; } };
  await registerAccountType({
    user: { userId: user._id, isAuthenticated: true },
    body: { type: "Student", phone: "+91 98765 43210", details: { instituteName: "College", qualification: "Civil", specialization: "Survey", discoverySource: "google" } },
  }, res, (error) => { failure = error; });
  assert.equal(failure, undefined);
  assert.equal(saved, true);
  assert.equal(response.user.phone, "+919876543210");
  assert.deepEqual(response.user.phoneVerifiedAt, new Date("2026-01-01"));
  assert.equal(response.user.password, undefined);
});
test("SMS delivery failure removes only its own pending challenge", async (t) => {
  process.env.JWT_SECRET ||= "test-only-secret";
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => ({ _id: "user-a" }));
  let challengeId;
  t.mock.method(Verification, "findOneAndUpdate", async (_filter, update) => {
    assert.equal(update.$set.phone, "+919876543210");
    challengeId = update.$set.challengeId;
  });
  const cleanup = t.mock.method(Verification, "deleteOne", async (filter) => {
    assert.deepEqual(filter, { user: "user-a", challengeId });
  });
  t.mock.method(globalThis, "fetch", async () => { throw new Error("network failure"); });
  let failure;
  await sendOnboardingCode({ user: { isAuthenticated: true, userId: "user-a" }, body: { phone: "+919876543210" } }, {}, (error) => { failure = error; });
  assert.equal(failure.statusCode, 503);
  assert.equal(cleanup.mock.callCount(), 1);
});

test("onboarding blocks an existing phone before sending, verifying, or completing setup", async (t) => {
  t.mock.method(User, "findById", async () => ({ _id: "new-user" }));
  t.mock.method(User, "exists", async (filter) => {
    assert.equal(filter.phone, "+919876543210");
    assert.deepEqual(filter._id, { $ne: "new-user" });
    return { _id: "existing-user" };
  });
  const send = t.mock.method(Verification, "findOneAndUpdate", async () => { throw new Error("Must not create or verify a challenge"); });
  const lookup = t.mock.method(Verification, "findOne", async () => { throw new Error("Must not complete setup"); });
  for (const handler of [sendOnboardingCode, verifyOnboardingCode, registerAccountType]) {
    let failure;
    await handler({ user: { userId: "new-user", isAuthenticated: true }, body: { phone: "+91 (98765) 43210", code: "123456", type: "Student", details: {} } }, {}, error => { failure = error; });
    assert.equal(failure.statusCode, 409);
    assert.match(failure.message, /Phone number already registered/);
  }
  assert.equal(send.mock.callCount(), 0);
  assert.equal(lookup.mock.callCount(), 0);
});

test("a concurrent phone registration is reported as a conflict", async (t) => {
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => ({
    save: async () => { throw Object.assign(new Error("duplicate"), { code: 11000, keyPattern: { phone: 1 } }); },
  }));
  t.mock.method(Verification, "findOne", async () => ({ verifiedAt: new Date() }));
  let failure;
  await registerAccountType({ user: { userId: "new-user", isAuthenticated: true }, body: {
    phone: "+919876543210", type: "Student", details: { instituteName: "College", qualification: "Civil", specialization: "Survey", discoverySource: "google" },
  } }, {}, error => { failure = error; });
  assert.equal(failure.statusCode, 409);
  assert.match(failure.message, /Phone number already registered/);
});

test("phone uniqueness excludes empty and missing phone values", () => {
  const index = User.schema.indexes().find(([keys]) => keys.phone === 1);
  assert.equal(index[1].unique, true);
  assert.deepEqual(index[1].partialFilterExpression, { phone: { $type: "string", $gt: "" } });
});

test("widget send and verification use MSG91's request ID and validate the access token", async (t) => {
  configureWidget(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push(url.split("/").at(-1));
    assert.equal(options.method, "POST");
    assert.equal(body.authkey, "test-key");
    let message;
    if (url.endsWith("sendOtp")) {
      assert.equal(body.widgetId, "test-widget");
      assert.equal(body.identifier, "919876543210");
      assert.equal(body.otp, undefined);
      message = "request-123";
    } else if (url.endsWith("verifyOtp")) {
      assert.equal(body.reqId, "request-123");
      assert.equal(body.otp, "123456");
      message = "access-token";
    } else {
      assert.equal(body["access-token"], "access-token");
      message = "919876543210";
    }
    return { ok: true, json: async () => ({ type: "success", message }) };
  });
  const requestId = await sendWidgetCode("+919876543210");
  await verifyWidgetCode(requestId, "123456", "+919876543210");
  assert.deepEqual(calls, ["sendOtp", "verifyOtp", "verifyAccessToken"]);
});

test("widget rejects mismatched identifiers, provider errors, malformed responses, and missing configuration", async (t) => {
  configureWidget(t);
  let response = { type: "success", message: "another-phone" };
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => response }));
  await assert.rejects(verifyWidgetCode("request", "123456", "+919876543210"), /does not match/);
  response = { type: "error", message: "sensitive provider details" };
  await assert.rejects(sendWidgetCode("+919876543210"), { statusCode: 503, message: "Could not send the SMS verification code. Please try again shortly." });
  response = { type: "success" };
  await assert.rejects(sendWidgetCode("+919876543210"), /invalid request ID/);
  delete process.env.MSG91_WIDGET_ID;
  await assert.rejects(sendWidgetCode("+919876543210"), /not configured/);
});

test("send binds the provider request to the challenge and never exposes provider credentials", async (t) => {
  configureWidget(t);
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => ({ _id: "user-a" }));
  let challengeId;
  t.mock.method(Verification, "findOneAndUpdate", async (_filter, update) => { challengeId = update.$set.challengeId; });
  t.mock.method(Verification, "updateOne", async (filter, update) => {
    assert.deepEqual(filter, { user: "user-a", challengeId });
    assert.equal(update.$set.providerRequestId, "provider-id");
    return { modifiedCount: 1 };
  });
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ type: "success", message: "provider-id" }) }));
  let result;
  let failure;
  await sendOnboardingCode({ user: { userId: "user-a", isAuthenticated: true }, body: { phone: "+919876543210" } }, { json: data => { result = data; } }, error => { failure = error; });
  assert.equal(failure, undefined);
  assert.deepEqual(result, { success: true, phone: "+919876543210", retryAfter: 60 });
});

test("invalid widget verification never marks the challenge verified", async (t) => {
  configureWidget(t);
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "findById", async () => ({ _id: "user-a" }));
  t.mock.method(Verification, "findOneAndUpdate", async (filter) => {
    assert.deepEqual(filter.providerRequestId, { $type: "string" });
    return { _id: "challenge", challengeId: "local-id", providerRequestId: "provider-id" };
  });
  const save = t.mock.method(Verification, "updateOne", async () => { throw new Error("Must not verify"); });
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ type: "error" }) }));
  let failure;
  await verifyOnboardingCode({ user: { userId: "user-a", isAuthenticated: true }, body: { phone: "+919876543210", code: "123456" } }, {}, error => { failure = error; });
  assert.equal(failure.statusCode, 400);
  assert.equal(save.mock.callCount(), 0);
});
