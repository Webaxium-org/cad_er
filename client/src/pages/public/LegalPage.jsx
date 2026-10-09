import { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

const contactEmail = "admin@getcader.com";

const pages = {
  terms: {
    title: "Terms & Conditions",
    intro: "These basic terms explain how you may use CADER and its surveying tools.",
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
    title: "Privacy Policy",
    intro: "This policy describes the information CADER uses to run its accounts, surveys, reports, and support features.",
    sections: [
      {
        title: "Information you provide",
        paragraphs: [
          "We receive information you enter when you create an account or use CADER, such as your name, email address, profile details, project and survey information, field readings, and support messages or attachments.",
          "If you use Google sign-in, we receive the basic account details needed to identify your account. Contact and demo forms may also collect the details you submit there.",
        ],
      },
      {
        title: "How information is used",
        paragraphs: [
          "We use this information to sign you in, provide surveying and reporting features, save your work, respond to support requests, and maintain the service. A project location may be used to show a relevant weather forecast when that feature is used.",
        ],
      },
      {
        title: "Storage and service providers",
        paragraphs: [
          "CADER uses browser storage to keep some session and app state on your device. The app may cache files for offline access. Information you submit can be processed by providers that help with sign-in, hosting, file storage, and email delivery.",
        ],
      },
      {
        title: "Keeping and managing information",
        paragraphs: [
          "You can contact us to ask about retention or to request access to, correction of, or deletion of your account information. We may need to verify your identity before acting on a request, and some records may need to be kept for operational or legal reasons.",
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
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          color: "white",
          pt: { xs: 10, md: 12 },
          pb: { xs: 12, md: 14 },
          borderRadius: "0 0 20px 20px",
        }}
      >
        <Container maxWidth="md">
          <Typography component="h1" variant="h3" fontWeight={900} sx={{ fontSize: { xs: "2rem", md: "3rem" } }}>
            {page.title}
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 680, opacity: 0.9, lineHeight: 1.7 }}>
            {page.intro}
          </Typography>
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
