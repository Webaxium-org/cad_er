# Onboarding SMS verification with the default MSG91 OTP Widget

Step 2 uses MSG91's OTP Widget APIs. MSG91 generates and verifies the code. The backend keeps the provider request ID bound to the authenticated user and normalized phone, verifies the returned access token through MSG91, and checks its identifier before marking the challenge verified. Browser responses contain neither MSG91 credentials nor access tokens. Existing-number checks, the unique phone index, five-attempt limit, sixty-second resend cooldown, and ten-minute local challenge window remain enforced.

## MSG91 setup

1. Open MSG91 Dashboard > OTP > OTP Widget (the menu may show OTP Widget/SDK). Create a new widget and name it CADer Onboarding.
2. Select OTP verification, Mobile Number as the contact point, SMS as the primary channel, and six-digit OTPs. Keep Mobile Integration and Invisible OTP off for this server API integration.
3. Set resend time to 60 seconds. Set provider expiration to at least 10 minutes (if the dashboard requires a 15-minute minimum, use 15; CADer still rejects the local challenge after 10 minutes).
4. In the SMS channel configuration, select MSG91's default template/default sender configuration. Do not create a custom sender or DLT template for this option.
5. Disable widget CAPTCHA for this backend API flow: MSG91's direct Widget APIs do not support CAPTCHA or Invisible OTP. CADer's authenticated endpoints and rate limits remain enabled.
6. Restrict allowed countries to those you intend to support. Skip demo credentials and User Existence Validation for production onboarding. CADer already rejects phone numbers belonging to other accounts.
7. Save/enable the widget. Copy its Widget ID from its integration section. Keep your existing server Authkey; no browser widget token is required for this backend API flow.
8. Under OTP Widget > Upgrade > Show Details, review the Dial Plan and set a Monthly Cap before testing. The default sender/template uses OTP Widget subscription billing, which differs from custom SMS wallet pricing. A Free Plan label does not establish unlimited free SMS. MSG91 notes that account-level communication and price-block settings do not apply to the default template.

## Server environment

```env
MSG91_AUTH_KEY=your_private_server_authkey
MSG91_WIDGET_ID=your_otp_widget_id
```

`MSG91_OTP_TEMPLATE_ID` is no longer used. Set both variables in `server/.env` for local development and in DigitalOcean's backend runtime environment for deployment, then restart/redeploy. With no fixed outbound IP, configure the MSG91 Authkey's IP Security accordingly. Do not enable paid DigitalOcean egress IPs just for this integration.

## Endpoints and verification

- `POST /onboarding/sms/send-code` with `{ "phone": "+919876543210" }` calls Widget Send OTP and saves the request ID on the pending challenge. Resending starts a new request and invalidates the previous local challenge.
- `POST /onboarding/sms/verify-code` with `{ "phone": "+919876543210", "code": "123456" }` calls Widget Verify OTP followed by Verify Access Token. The verified identifier must match the phone.
- Account completion requires an unexpired verified challenge for the exact phone and saves `phoneVerifiedAt`.

Existing completed accounts are unaffected. Earlier email/custom-template challenges cannot satisfy Widget verification because they have no provider request ID. They expire through the TTL index.

Phone uniqueness: startup waits for User indexes. Before deployment, normalize legacy phone values to international `+countrycode` format and resolve duplicate nonempty values so the unique index can be created. Existing account data is not rewritten or deleted.

Run `node --test --test-isolation=none server/tests/onboardingVerification.test.js` and the client production build. Tests mock MSG91; a real send/verify/setup test is still required after setting the Widget ID, enabling its default SMS configuration, and confirming billing.

References:
- https://docs.msg91.com/otp-widget
- https://msg91.com/help/sendotp/how-to-integrate-the-new-login-with-otp-widget/
- https://msg91.com/help/sendotp/how-to-integrate-the-new-login-with-otp-widget/msg91-otp-widget-subscription-
