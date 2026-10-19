import { Box, Typography, Stack, Button, Paper } from "@mui/material";
import { motion as Motion } from "framer-motion";

const displayPrice = value => value === "Custom" ? "Custom" : `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CheckIcon = () => (
  <Box component="span" aria-hidden="true" sx={{ color: "#4f46e5", fontWeight: 900, fontSize: 20, lineHeight: 1, flexShrink: 0 }}>&#10003;</Box>
);

export default function PricingCard ({
  tier,
  price,
  introductoryPrice,
  discountLabel,
  duration,
  renewalText,
  includesTier,
  features,
  highlighted = false,
  buttonText = "Contact Sales",
  handleContactSales,
  disabled = false,
  buttonHref,
}) { return (
  <Motion.div
    whileHover={{ y: -10 }}
    transition={{ type: "spring", stiffness: 300 }}
    style={{ height: "100%" }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        borderRadius: 6,
        border: "1px solid",
        borderColor: highlighted ? "#4f46e5" : "rgba(0,0,0,0.08)",
        bgcolor: highlighted ? "#fff" : "rgba(255,255,255,0.6)",
        position: "relative",
        overflow: "hidden",
        boxShadow: highlighted
          ? "0 30px 60px rgba(79, 70, 229, 0.15)"
          : "none",
      }}
    >
      {highlighted && (
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: -35,
            bgcolor: "#4f46e5",
            color: "white",
            px: 6,
            py: 0.5,
            transform: "rotate(45deg)",
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Most Popular
        </Box>
      )}

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#111" }}>
        {tier}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          mb: 0.5,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, color: "#000" }}>
          {displayPrice(introductoryPrice || price)}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", ml: 1 }}>
          /{duration}
        </Typography>
      </Box>

      {introductoryPrice &&
        introductoryPrice !== price &&
        introductoryPrice !== "Custom" &&
        price !== "Custom" && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textDecoration: Number(introductoryPrice) < Number(price) ? "line-through" : "none" }}
            >
              {displayPrice(price)}/{duration}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#4f46e5",
                fontWeight: 700,
                bgcolor: "#eef2ff",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.75rem",
              }}
            >
              {discountLabel || "Launch Price"}
            </Typography>
          </Box>
        )}

      {price !== "Custom" && <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 2.5 }}>
        Excludes GST and processing fee
      </Typography>}

      {renewalText && <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>{renewalText}</Typography>}

      {includesTier && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#4f46e5" }}
          >
            All features from <Box component="strong">{includesTier}</Box>
          </Typography>
        </Box>
      )}

      <Stack spacing={2} sx={{ mb: 5 }}>
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <CheckIcon />
            <Typography variant="body2" sx={{ color: "#444", fontWeight: 500 }}>
              {feature}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Button
        variant={highlighted ? "contained" : "outlined"}
        fullWidth
        sx={{
          mt: "auto",
          py: 1.5,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "1rem",
          bgcolor: highlighted ? "#4f46e5" : "transparent",
          color: highlighted ? "#fff" : "#111",
          borderColor: highlighted ? "#4f46e5" : "rgba(0,0,0,0.2)",
          "&:hover": {
            bgcolor: highlighted ? "#4338ca" : "rgba(0,0,0,0.05)",
            borderColor: highlighted ? "#4338ca" : "#000",
          },
        }}
        disabled={disabled}
        href={buttonHref}
        onClick={handleContactSales}
      >
        {buttonText}
      </Button>
    </Paper>
  </Motion.div>
);
}
