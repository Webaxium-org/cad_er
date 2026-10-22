import test from "node:test";
import assert from "node:assert/strict";
import Survey from "../models/survey.js";
import Subscription from "../models/subscription.js";
import { reserveProjectSlot } from "../services/subscriptionAccess.js";
import { syncTrialProjectLimit } from "../services/trialSubscription.js";

const trial = () => ({ _id: "trial", userId: "owner", kind: "trial", status: "active", projectCount: 0, projectLimit: 5,
  trialProjectTypes: [], periodStart: new Date(Date.now() - 10000), periodEnd: new Date(Date.now() + 60000) });
const req = (subscription, type) => ({ user: { userId: "owner", role: "Guest" }, subscription, body: { type } });

test("trial users can reserve one project of each type, and concurrent duplicate reservations are rejected", async t => {
  const subscription = trial();
  const session = {};
  t.mock.method(Survey, "exists", () => ({ session: async () => null }));
  t.mock.method(Subscription, "findOneAndUpdate", async (filter, update, options) => {
    assert.equal(options.session, session);
    assert.deepEqual(filter.$expr.$lt[1], { $min: ["$projectLimit", 2] });
    assert.equal(filter.trialProjectTypes.$ne, update.$addToSet.trialProjectTypes);
    const type = update.$addToSet.trialProjectTypes;
    if (subscription.trialProjectTypes.includes(type) || subscription.projectCount >= 2) return null;
    subscription.projectCount++;
    subscription.trialProjectTypes.push(type);
    return subscription;
  });
  const roadResults = await Promise.allSettled([
    reserveProjectSlot(req(subscription, "Road Survey"), session),
    reserveProjectSlot(req(subscription, "Road Survey"), session),
  ]);
  assert.equal(roadResults.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(roadResults.find(result => result.status === "rejected").reason.status, 402);
  await reserveProjectSlot(req(subscription, "Water Way"), session);
  await assert.rejects(reserveProjectSlot(req(subscription, "Water Way"), session), error => error.status === 402);
  assert.equal(subscription.projectCount, 2);
  assert.deepEqual(subscription.trialProjectTypes, ["Road Survey", "Water Way"]);
});

test("existing trial projects, including deleted ones, prevent another project of the same type", async t => {
  const subscription = trial();
  t.mock.method(Survey, "exists", filter => {
    assert.equal(filter.createdBy, "owner");
    assert.equal(filter.type, "Water Way");
    assert.equal(filter.deleted, undefined);
    assert.deepEqual(filter["branchDetails.isBranch"], { $ne: true });
    assert.equal(filter.createdAt.$gte, subscription.periodStart);
    return { session: async () => ({ _id: "legacy-project" }) };
  });
  const write = t.mock.method(Subscription, "findOneAndUpdate", () => { throw Error("Unexpected write"); });
  await assert.rejects(reserveProjectSlot(req(subscription, "Water Way")), error => error.status === 402);
  assert.equal(write.mock.callCount(), 0);
});

test("paid plans retain their existing total quota without per-type restrictions", async t => {
  const subscription = { ...trial(), kind: "paid", paidCount: 1, projectLimit: 10 };
  const read = t.mock.method(Survey, "exists", () => { throw Error("Paid plans should not check survey types"); });
  t.mock.method(Subscription, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.trialProjectTypes, undefined);
    assert.equal(filter.$expr.$lt[1], "$projectLimit");
    assert.deepEqual(update, { $inc: { projectCount: 1 } });
    return subscription;
  });
  await reserveProjectSlot(req(subscription, "Road Survey"));
  await reserveProjectSlot(req(subscription, "Road Survey"));
  assert.equal(read.mock.callCount(), 0);
});

test("existing trial limits sync to two; paid limits are not changed", async t => {
  const subscription = trial();
  const write = t.mock.method(Subscription, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.kind, "trial");
    assert.equal(update.$set.projectLimit, 2);
    return { ...subscription, projectLimit: 2 };
  });
  assert.equal((await syncTrialProjectLimit(subscription)).projectLimit, 2);
  const paid = { ...subscription, kind: "paid" };
  assert.equal(await syncTrialProjectLimit(paid), paid);
  assert.equal(write.mock.callCount(), 1);
});
