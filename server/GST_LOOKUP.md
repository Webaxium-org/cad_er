# GSTIN-only profile lookup

The profile has one input: GSTIN. "Fetch and save GST details" calls the server, fetches the registered legal name and principal business address, and saves them on the authenticated user's account. The result is displayed read-only with a fetched timestamp. Other browser-supplied firm fields are ignored. Removing GST clears the fetched details. Existing invoice recipient snapshots never change.

## Activation

1. Create a free account at https://www.gstinapi.in/ and verify your email.
2. Generate a key in the provider's API Keys dashboard.
3. Add this to the local/deployed server environment (do not put it in the client environment or commit it):

```dotenv
GSTIN_API_KEY=your_private_key
```

4. Restart the server. Open Profile > GST details and enter your business's real GSTIN.

The integration uses the provider's documented `GET https://www.gstinapi.in/v1/gstin/{gstin}` with an `x-api-key` header. No new dependency is required. https://www.gstinapi.in/docs

The provider advertises starter free credits (10 on signup and up to 75 total through additional setup steps). This is a limited free allowance, not an unlimited free production service. No pack, subscription or paid contact lookup is enabled by this integration. Once credits run out, a lookup error is shown and existing saved details remain unchanged. Provider terms/allowances can change.

Registered mobile lookup is a separate paid endpoint. The free/basic integration leaves `gstMobile` empty and displays "Not provided by the GST lookup"; it never presents the account phone as a fetched registered number. No mobile number is promised or fabricated.

Successful results must match the submitted GSTIN, be active, and contain a legal name and address. The server normalizes and whitelists the response. Failed, incomplete or inactive results do not overwrite saved details. Identical saved details fetched within 24 hours are reused unless the user explicitly refreshes. Concurrent identical in-process lookups share a request. Requests time out; redirects are refused. The profile save/lookup endpoint is rate-limited per authenticated account.

Provider credentials, balances and raw provider error bodies are never returned to the browser. No signup, key issuance, payment or live lookup is performed automatically by the code change. Account creation/email verification must be completed by the account owner. Without `GSTIN_API_KEY`, the UI clearly shows lookup is not available and existing subscription checkout remains available.

## Verification

```powershell
node --test --test-isolation=none server/tests/*.test.js
cd client
npm run build
```

Live acceptance: add the key, look up your GSTIN, reload and confirm the saved firm details remain; issue a test invoice and check name/address/GSTIN; change or remove GST details and check old invoices remain unchanged. Provider error paths are tested with mocked responses without consuming credits.
