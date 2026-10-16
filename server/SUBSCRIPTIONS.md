# Professional subscriptions

Professional accounts receive one 30-day trial with the configured project allowance. Paid purchases and their quotas live in `Subscription`; published catalog versions live in `PlanVersion`.

## Admin settings

Super Admin > Settings > Pricing plans (`/settings`; `/admin/plans` redirects here) manages names, regular prices, project limits, features, visibility, and an optional first-period offer. Each publish inserts a permanent version and records its author. Concurrent edits are rejected.

Super Admin > Payments (`/admin/payments`) shows captured subscription charges, gross totals, customer counts, first-period and renewal breakdowns, and a searchable payment history. Today, this week, this month, custom inclusive calendar dates, and all-time filters use the administrator's local date boundaries. Totals are gross recorded captures; this ledger does not deduct refunds or represent Razorpay settlements.

For Junior at INR 99 for the first month and INR 999 thereafter:

1. Set the regular monthly price to INR 999.
2. Enable **First-period offer** and set its price to INR 99.
3. Publish the version.

The administrator can change the offer price or uncheck it and publish again. Removing it makes new purchases use the regular price immediately. Existing purchases and saved checkouts retain their snapshot. The offer applies to the customer's first paid purchase of that plan code; cancelling and purchasing the same plan again does not repeat the introductory discount. Authenticated pricing reflects eligibility.

New offer versions do not require dates, a payment-method selector, or a Razorpay offer ID. Existing provider-offer versions and subscriptions remain readable and use their original provider flow until the administrator replaces the catalog version. Editing one displays a migration notice. No existing mandate is silently changed.

## Payment flow

With a first-period offer, checkout has two explicit steps:

1. **Initial payment:** the server creates a Razorpay Order for the first-period price. The customer pays using a method available in ordinary Checkout. Access is granted only after the stored order, signature, captured amount, and currency are verified. A matching `payment.captured`/`order.paid` webhook also grants access if the browser closes. The first successful payment establishes one calendar month/year of access; month-end and leap-year dates are clamped. Duplicate callbacks cannot restart access or reset quota.
2. **Auto pay authorization:** the customer selects Continue to auto pay. The server creates a subscription at the purchased regular price, with `start_at` equal to the paid first period's end. It includes neither an upfront add-on nor a provider offer. Cards, UPI AutoPay, and eMandate are presented according to the merchant account and provider eligibility. Bank authorization may be delayed or include a mandate verification payment displayed by Razorpay. The customer must complete this step for renewal to occur.

This split keeps the introductory price independent of the recurring payment method. It does not assume that an eMandate can collect an immediate upfront subscription add-on. If the customer stops after the first payment, that period remains paid and authorization can be resumed before expiry. Without an authorized mandate, access stops at the paid period's end. Auto pay setup is refused in the final hour to avoid starting a mandate with a past/near-immediate debit date.

Without an offer (including an ineligible returning customer), the existing regular subscription checkout starts recurring billing immediately.

The setup endpoint uses the purchased version, never the latest catalog price. Billing locks prevent concurrent setup/cancellation. An existing mandate is resumed rather than duplicated. Cancelling before the first recurring charge cancels the future mandate immediately while keeping paid initial access. Failed renewals cannot advance the last paid access period. A full refund of the initial payment revokes that initial entitlement when its webhook is processed.

Initial payments and recurring invoice payments are recorded separately with actual captured amounts, subscription references and version IDs. Recurring invoice ownership and amount are verified against Razorpay. Provider payment IDs are unique. The paid count remains the provider's recurring cycle count; the separate initial payment does not increment it.

## Deployment and provider setup

1. Enable Razorpay Subscriptions and the desired recurring payment methods for the account. Use test credentials first.
2. Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` only on the server. Enable automatic payment capture for ordinary Orders; an authorized-but-uncaptured payment does not grant access.
3. At `https://<api-host>/api/subscriptions/webhook`, subscribe to **payment.captured**, **order.paid**, **payment.refunded**, plus subscription lifecycle events including authenticated, activated, charged, pending, halted, cancelled and completed. Use separate test/live webhook secrets. Initial-payment events are required for reliable browser-independent activation. The account refresh endpoint also reconciles a pending initial order.
4. Restart the server to initialize the new unique sparse order/payment indexes and catalog models. A fresh database seeds the supplied catalog: Junior INR 999/month (first month INR 99), Executive INR 4,999/month (first month INR 499), Director INR 9,999/month (first month INR 999), Engineer INR 19,999/year (first year INR 5,999), and Proprietor INR 49,999/year (first year INR 11,999). Existing databases can run `node scripts/applyInitialPlanCatalog.js` once. It corrects untouched initial versions, including the formerly reversed yearly prices, only when they have no paid subscriptions or provider mapping; otherwise it publishes version 2 to preserve purchased/provider-linked terms. The script is idempotent and refuses customized catalogs.
   If that migration created Junior version 2 solely to protect the original INR 99 subscriptions, run `node scripts/resetJuniorPlanVersion.js`. It moves the original version and its provider mapping to an archive code and renumbers the current Junior catalog as version 1. The archived record remains addressable by existing purchases but is excluded from the visible catalog and Junior history. The current version 1 creates a separate Razorpay plan at the INR 999 regular price.
5. The provider plan is created on first checkout/setup for each version and key ID. Version 1 reuses original mappings; subsequent versions have separate mappings. The server verifies regular amount, currency and frequency before use.
6. Initial checkout links are locally limited to 30 minutes. A previously attempted order is reconciled before retry; after failure, cancel that saved checkout and create a fresh order. An already-issued order cannot be revoked by editing the catalog. A late successful capture is still honored at its recorded terms; cancellation prevents auto pay setup for that purchase.

Test with the actual account in Razorpay test mode before enabling live purchases. Verify initial payment, abandoned checkout recovery, mandate authorization for each enabled method, scheduled full-price renewal, failed renewal, cancellation, refund, and duplicate webhook delivery. eMandate registration and charge timing depend on the bank.

## Local verification

From `client`: `npm run build`.

Run migration and index creation against staging MongoDB before production rollout.

## Project access

The initial default allowances are Junior 1/month, Executive 6/month, Director 14/month, Engineer 80/year and Proprietor 200/year. Admin changes affect new purchases; existing subscribers retain their purchased allowance. Project creation reserves a quota slot in the same MongoDB transaction as the project. Deleting a project does not restore a consumed slot. Initial paid access is eligible for the same quota checks even while its future mandate is awaiting authorization.

Survey, ticket and Professional settings require active paid or trial access. Dashboard, profile and subscription pages remain accessible for renewal and setup. Super Admin is exempt. A paid period ends the trial; the application does not restore an unused trial after cancellation or refund. Institutions and Enterprise remain a manual sales flow.

## Provider references

- [Create an Order](https://razorpay.com/docs/api/orders/create/)
- [Standard Checkout verification](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Create a Subscription and schedule its start](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/)
- [Supported recurring methods](https://razorpay.com/docs/payments/subscriptions/supported-payment-methods)
