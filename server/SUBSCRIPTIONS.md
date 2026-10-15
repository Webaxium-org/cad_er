# Professional subscriptions

Professional onboarding creates one 30-day trial subscription with five new projects. The trial dates and project count live in the `Subscription` collection. `TRIAL_PROJECT_LIMIT` can change the allowance for new trials; existing subscription records retain their assigned limit.

## Razorpay setup

1. Enable Razorpay Subscriptions in the Razorpay account. Use test keys first.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the server environment. Never put the secret in the client environment.
3. The server creates a Razorpay plan on the first checkout for each offered tier and stores its ID in MongoDB. No plan IDs need to be configured manually. Plans are kept separate for test and live key IDs. The checkout endpoint verifies the stored Razorpay plan's amount and frequency before using it.
4. Set a separate `RAZORPAY_WEBHOOK_SECRET`. Configure a Razorpay webhook at `https://<api-host>/api/subscriptions/webhook` and select subscription lifecycle events, especially `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, and `subscription.completed`. Configure separate test and live webhooks and secrets.
5. Test the trial, plan checkout, failed payment, renewal, cancellation, duplicate webhook, and the monthly/yearly project counters in Razorpay test mode. Switch to live credentials and live plan IDs only after those checks pass.

The server alone selects prices and plan IDs. Checkout signatures are verified with the API secret. Webhook signatures use the raw request body and the webhook secret; event IDs prevent duplicate processing. The webhook fetches the current subscription from Razorpay before applying state, so out-of-order events cannot roll the account back to an older status.

The five self-service plans have fixed project allowances per billing period: Junior 1/month, Executive 6/month, Director 14/month, Professionals 80/year, and Teams 200/year. A queued project counts when it is created. A project deleted later does not restore the consumed slot. Institution and Enterprise pricing remains a manual sales flow; it is not sent through the self-service checkout.

Survey, ticket, and settings API routes require an active subscription for Professional users. The dashboard, profile, pricing, and subscription pages remain available so an expired user can renew. Survey creation and queued-project creation reserve one quota slot in the same MongoDB transaction as the project. Super Admin access is exempt so administrators can operate the app.

An active paid period supersedes the trial. Checkout during the trial starts paid billing immediately. Cancellation is scheduled for the end of the paid period. Existing Professional accounts without a subscription receive one trial record on their first dashboard request. A legacy trial date previously stored on `User` is moved to `Subscription` at that point and removed from `User`.
