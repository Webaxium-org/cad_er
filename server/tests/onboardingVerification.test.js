import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/user.js";
import Verification from "../models/onboardingVerification.js";
import { normalizePhone, generateEmailCode, hashEmailCode } from "../utils/onboardingVerification.js";
import { sendOnboardingCode, verifyOnboardingCode } from "../controllers/onboardingVerificationController.js";
import { registerAccountType } from "../controllers/indexController.js";

test("phone numbers require a country code and valid length", () => {
  assert.equal(normalizePhone("+91 (98765) 43210"), "+919876543210");
  for (const value of [null, 123, "", "9876543210", "+0123456789", "+123", "+1234567890123456", "+91abc9876543210"]) {
    assert.equal(normalizePhone(value), null);
  }
});

test("verification codes are six digits and hashes are bound to the user and email", () => {
  process.env.JWT_SECRET ||= "test-only-secret";
  const code = generateEmailCode();
  assert.match(code, /^\d{6}$/);
  const hash = hashEmailCode("user-a", "a@example.com", code);
  assert.equal(hash.length, 64);
  assert.notEqual(hash, hashEmailCode("user-b", "a@example.com", code));
  assert.notEqual(hash, hashEmailCode("user-a", "b@example.com", code));
});

test("email verification rejects invalid, expired and exhausted codes, and accepts a valid code", async (t) => {
  process.env.JWT_SECRET ||= "test-only-secret";
  const user = { _id: "user-a", email: "a@example.com" };
  t.mock.method(User, "findById", async () => user);
  const req = { user: { isAuthenticated: true, userId: user._id }, body: { code: "123456" } };
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
  challenge = { _id: "challenge", codeHash: hashEmailCode(user._id, user.email, "654321") };
  await verifyOnboardingCode(req, res, next);
  assert.match(failure.message, /Incorrect/);
  assert.equal(save.mock.callCount(), 0);
  challenge.codeHash = hashEmailCode(user._id, user.email, req.body.code);
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

test("account setup still rejects missing phone while email verification is disabled", async (t) => {
  t.mock.method(User, "findById", async () => ({ email: "a@example.com" }));
  t.mock.method(Verification, "findOne", async (filter) => {
    assert.equal(filter.email, "a@example.com");
    assert.deepEqual(filter.verifiedAt, { $ne: null });
    assert.ok(filter.expiresAt.$gt instanceof Date);
    return null;
  });
  const req = { user: { userId: "user-a", isAuthenticated: true }, body: { type: "Student", details: {} } };
  let failure;
  await registerAccountType(req, {}, (error) => { failure = error; });
  assert.match(failure.message, /phone number/);
  req.body.phone = "+919876543210";
  await registerAccountType(req, {}, (error) => { failure = error; });
  assert.equal(failure.message, "All student fields are required");
});

test("resend cooldown rejects concurrent requests before sending email", async (t) => {
  process.env.JWT_SECRET ||= "test-only-secret";
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
  await sendOnboardingCode({ user: { isAuthenticated: true, userId: "user-a" } }, {}, (error) => { failure = error; });
  assert.equal(failure.statusCode, 429);
});

test("setup saves the required phone without email verification", async (t) => {
  let saved = false;
  const user = {
    _id: "user-a", email: "a@example.com",
    save: async () => { saved = true; },
    toObject: () => ({ phone: user.phone, emailVerifiedAt: user.emailVerifiedAt, type: user.type, password: "private" }),
  };
  t.mock.method(User, "findById", async () => user);
  t.mock.method(Verification, "findOne", async () => { throw new Error("Email verification should be disabled"); });
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
  assert.equal(response.user.emailVerifiedAt, undefined);
  assert.equal(response.user.password, undefined);
});
