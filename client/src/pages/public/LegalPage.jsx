import { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { publicEyebrowSx, publicHeroTitleSx, publicHeroLeadSx } from "../../components/publicTypography";
import { motion } from "framer-motion";
import { publicHeroMotion } from "../../components/publicMotion";

const contactEmail = "admin@getcader.com";

const pages = {
  terms: {
    titleLead: "Terms &",
    titleAccent: "Conditions",
    intro: "These terms explain CADER's surveying service, paid plans, billing, and cancellation.",
    sections: [
      {
        title: "Using CADER",
        paragraphs: [
          "You may use CADER to manage surveys, field readings, projects, reports, and related work. Please provide accurate account information and use the service only for work you are authorized to perform.",
        ],
      },
      {
        title: "Your account",
        paragraphs: [
          "Keep your sign-in details secure. You are responsible for activity through your account and should contact us if you believe someone else has gained access.",
        ],
      },
      {
        title: "Subscriptions and billing",
        paragraphs: [
          "Plan prices, billing intervals, project allowances, and any introductory price are shown on the subscription page. The checkout shows GST, processing fees, and the total payable before you pay. Prices are in Indian rupees. An introductory price applies only when you are eligible for it; the regular price applies to later periods.",
          "Payments are processed through Razorpay. Some plans require a first-period payment followed by a separate auto pay authorization. Where you authorize auto pay, future charges are scheduled at the regular plan price for the billing interval shown at checkout. Your bank or payment provider may require a separate verification step or payment when you authorize a mandate.",
          "You can cancel renewal from your subscription page. Cancellation stops future renewals and paid access continues to the end of the current period. If you do not complete auto pay authorization, paid access ends when that period expires. A failed renewal does not extend access. Plan changes do not currently receive a prorated credit.",
        ],
      },
      {
        title: "Additional projects",
        paragraphs: [
          "A paid plan may let you purchase extra project capacity for the current billing period. The quantity, applicable taxes and fees, and total are shown at checkout. Unused capacity does not carry forward to another period. Deleting a project does not restore a used project slot.",
        ],
      },
      {
        title: "Cancellations and refund requests",
        paragraphs: [
          "Paid subscription periods and additional project purchases are generally non-refundable. Cancelling renewal prevents future plan charges; it does not refund a period already paid for. This policy does not limit any refund or other remedy required by applicable law.",
          "If you believe a charge was duplicate or incorrect, or paid access was not provided, email admin@getcader.com with your account email, payment ID, date, and reason. We will review your request and respond within 7 business days. Where a refund is required or approved, we will initiate it through Razorpay to the original payment method within 7 business days of approval. The time for the credit to appear also depends on Razorpay and your bank.",
        ],
      },
      {
        title: "Your data and reports",
        paragraphs: [
          "You remain responsible for the survey data, images, and other content you submit. You allow CADER to store and process that content as needed to provide the features you use.",
          "Check field measurements, calculations, drawings, and exported reports before relying on them for engineering, construction, or safety decisions.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "Do not use CADER to break the law, upload content you are not allowed to use, interfere with the service, or try to access another person's account or data without permission.",
        ],
      },
      {
        title: "Service changes",
        paragraphs: [
          "We may update features or these terms as the service develops. The current terms will be available on this page.",
        ],
      },
    ],
    related: { label: "Read Privacy Policy", to: "/privacy" },
  },
  privacy: {
    titleLead: "Privacy",
    titleAccent: "Policy",
    intro: "This policy explains how CADER handles account, surveying, and payment information.",
    sections: [
      {
        title: "Information you provide",
        paragraphs: [
          "We receive information you enter when you create an account or use CADER, such as your name, email address, phone number, profile details, project and survey information, field readings, and support messages or attachments.",
          "If you use Google sign-in, we receive the basic account details needed to identify your account. Contact and demo forms may also collect the details you submit there.",
        ],
      },
      {
        title: "How information is used",
        paragraphs: [
          "We use this information to sign you in, provide surveying and reporting features, save your work, respond to support requests, process purchases, manage subscriptions, prevent duplicate or fraudulent transactions, and maintain the service. A project location may be used to show a relevant weather forecast when that feature is used.",
        ],
      },
      {
        title: "Payments and Razorpay",
        paragraphs: [
          "When you pay or authorize auto pay, CADER opens Razorpay checkout and supplies your name, email address, and phone number, when available, to prefill it. Razorpay processes your chosen payment method and mandate. CADER receives payment status, amounts, dates, and Razorpay order, payment, subscription, and invoice references so we can activate access, show payment history, reconcile charges, and handle support or refunds.",
          "CADER does not ask you to enter card or bank credentials into its own forms and does not store full card numbers or bank account credentials in its application database. Razorpay handles payment credentials under its own privacy practices.",
        ],
      },
      {
        title: "Storage and service providers",
        paragraphs: [
          "CADER uses browser storage to keep some session and app state on your device. The app may cache files for offline access. Information you submit can be processed by providers that help with sign-in, hosting, file storage, email delivery, weather information, and payments, including Razorpay. We share information needed for those services and for legal or security purposes.",
        ],
      },
      {
        title: "Keeping and managing information",
        paragraphs: [
          "We keep information while it is needed to provide the service and to meet applicable recordkeeping, tax, accounting, dispute, and security requirements. Payment and subscription records may therefore remain after an account or subscription ends.",
          "You can contact us to ask about retention or to request access to, correction of, or deletion of your account information. We may need to verify your identity before acting on a request. We will explain when a request cannot be fully completed because retention is required by law or necessary for an unresolved transaction or dispute.",
        ],
      },
      {
        title: "Changes to this policy",
        paragraphs: [
          "We may update this page as CADER's features and data practices change. The current version will be available here.",
        ],
      },
    ],
    related: { label: "Read Terms & Conditions", to: "/terms" },
  },
};

export default function LegalPage({ type }) {
  const page = pages[type];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: 10 }}>
      <Box
        component={motion.div}
        {...publicHeroMotion}
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
          color: "white",
          pt: { xs: 10, md: 12 },
          pb: { xs: 12, md: 14 },
          borderRadius: "0 0 20px 20px",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ ...publicEyebrowSx, color: "#c7d2fe" }}>Legal information</Typography>
          <Typography component="h1" variant="h3" sx={{ ...publicHeroTitleSx, color: "white" }}>
            {page.titleLead} <Box component="span" sx={{ color: "#c7d2fe" }}>{page.titleAccent}</Box>
          </Typography>
          <Typography sx={{ ...publicHeroLeadSx, mt: 2, color: "white", opacity: 0.9 }}>
            {page.intro}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: "white", opacity: 0.85 }}>Last updated: 19 October 2026</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -6, position: "relative" }}>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: "1px solid #e2e8f0", borderRadius: 4, boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)" }}>
          <Stack spacing={4}>
            {page.sections.map((section) => (
              <Box component="section" key={section.title}>
                <Typography component="h2" variant="h6" fontWeight={800} color="#1e293b" sx={{ mb: 1.5 }}>
                  {section.title}
                </Typography>
                <Stack spacing={1.5}>
                  {section.paragraphs.map((paragraph) => (
                    <Typography key={paragraph} color="#475569" sx={{ lineHeight: 1.8 }}>
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ))}

            {type === "privacy" && <Typography color="#475569" sx={{ lineHeight: 1.8 }}>
              Razorpay also handles payment information under its <Box component="a" href="https://razorpay.com/privacy-policy/" target="_blank" rel="noopener noreferrer" sx={{ color: "#4f46e5", fontWeight: 700 }}>Privacy Policy</Box>.
            </Typography>}

            <Box component="section" sx={{ pt: 3, borderTop: "1px solid #e2e8f0" }}>
              <Typography component="h2" variant="h6" fontWeight={800} color="#1e293b" sx={{ mb: 1 }}>
                Questions or requests
              </Typography>
              <Typography color="#475569" sx={{ lineHeight: 1.8 }}>
                Contact us at{" "}
                <Box component="a" href={`mailto:${contactEmail}`} sx={{ color: "#4f46e5", fontWeight: 700 }}>
                  {contactEmail}
                </Box>
                .
              </Typography>
            </Box>
            <Box>
              <Button component={RouterLink} to={page.related.to} variant="outlined" sx={{ borderColor: "#c7d2fe", color: "#4f46e5", textTransform: "none", borderRadius: 2 }}>
                {page.related.label}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
