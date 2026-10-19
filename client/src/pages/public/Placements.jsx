import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  Grid,
  TextField,
  Chip,
  Pagination,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { publicHeroMotion, publicCardContainerVariants, publicCardVariants } from "../../components/publicMotion";
import ScrollToTop from "../../components/ScrollToTop";
import { publicEyebrowSx, publicHeroTitleSx, publicHeroLeadSx } from "../../components/publicTypography";
import { publicSectionStartSx } from "../../components/publicLayoutStyles";
import { getAllOpenings } from "../../services/openingServices";

// Custom SVG Icons
const IconMapPin = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconChevronRight = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const IconUpload = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const IconArrowLeft = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const IconCheckCircle = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 20 20"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const IconBuilding = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <line x1="9" y1="22" x2="9" y2="2"></line>
    <line x1="15" y1="22" x2="15" y2="2"></line>
    <line x1="4" y1="6" x2="20" y2="6"></line>
    <line x1="4" y1="10" x2="20" y2="10"></line>
    <line x1="4" y1="14" x2="20" y2="14"></line>
    <line x1="4" y1="18" x2="20" y2="18"></line>
  </svg>
);

const IconSearch = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ITEMS_PER_PAGE = 5;

const Placements = () => {
  const [placements, setPlacements] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlacements = useMemo(() => {
    return placements.filter(
      (p) =>
        p?.company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [placements, searchQuery]);

  const paginatedPlacements = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredPlacements.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlacements, page]);

  const totalPages = Math.ceil(filteredPlacements.length / ITEMS_PER_PAGE);

  const handleApply = (opening) => {
    setSelectedOpening(opening);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setSelectedOpening(null);
    }, 5000);
  };

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const { data } = await getAllOpenings();
        setPlacements(data?.openings || []);
      } catch (error) {
        console.error("Error fetching placements:", error);
      }
    };
    fetchPlacements();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", pb: 10 }}>
        {/* Header Section */}
        <Box
          component={motion.div}
          {...publicHeroMotion}
          sx={{
            bgcolor: "#f8fafc",
            pt: { xs: 8, md: 12 },
            pb: { xs: 6, md: 10 },
            borderBottom: "1px solid #dbeafe",
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Typography
                variant="overline"
                sx={publicEyebrowSx}
              >
                PLACEMENT PORTAL
              </Typography>
              <Typography
                component="h1"
                variant="h2"
                sx={publicHeroTitleSx}
              >
                Explore New <br />
                <span style={{ color: "#4f46e5" }}>Placement Openings</span>
              </Typography>
              <Typography
                variant="h6"
                sx={publicHeroLeadSx}
              >
                Connecting CADER certified professionals with leading
                construction and engineering firms globally.
              </Typography>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={publicSectionStartSx}>
          <AnimatePresence mode="wait">
            {!selectedOpening ? (
              <motion.div
                key="placement-list"
                variants={publicCardContainerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
              >
                <Stack spacing={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#f8fafc",
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 800, color: "#1e293b", minWidth: 150 }}
                    >
                      Search Openings:
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by company or role..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconSearch />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ bgcolor: "white" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", whiteSpace: "nowrap" }}
                    >
                      Showing {filteredPlacements?.length || 0} results
                    </Typography>
                  </Paper>

                  {paginatedPlacements?.length > 0 ? (
                    paginatedPlacements?.map((opening) => (
                      <Paper
                        component={motion.div}
                        variants={publicCardVariants}
                        key={opening._id}
                        elevation={0}
                        sx={{
                          p: 4,
                          borderRadius: 4,
                          border: "1px solid #e2e8f0",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "#4f46e5",
                            boxShadow:
                              "0 10px 25px -5px rgba(59, 130, 246, 0.1)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                              sx={{ mb: 1 }}
                            >
                              <Box
                                sx={{
                                  p: 1,
                                  bgcolor: "#eff6ff",
                                  borderRadius: 2,
                                  color: "#3b82f6",
                                }}
                              >
                                <IconBuilding />
                              </Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  color: "#64748b",
                                  textTransform: "uppercase",
                                }}
                              >
                                {opening.company?.name}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 800, color: "#111827" }}
                            >
                              {opening.title}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ color: "#64748b" }}
                              >
                                <IconMapPin />
                                <Typography variant="body2">
                                  {opening.location}
                                </Typography>
                              </Stack>
                              <Typography
                                variant="body2"
                                sx={{ color: "#3B82F6", fontWeight: 600 }}
                              >
                                {opening.stipend}
                              </Typography>
                            </Stack>
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {opening.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    bgcolor: "#f1f5f9",
                                    fontWeight: 600,
                                    color: "#475569",
                                    mb: 1,
                                  }}
                                />
                              ))}
                            </Stack>
                            <Typography
                              variant="caption"
                              sx={{ color: "#94a3b8", display: "block", mt: 1 }}
                            >
                              Deadline:{" "}
                              {new Date(opening?.deadline)?.toDateString()}
                            </Typography>
                          </Grid>
                          <Grid
                            size={{ xs: 12, md: 3 }}
                            sx={{ textAlign: { md: "right" } }}
                          >
                            <Button
                              variant="contained"
                              onClick={() => handleApply(opening)}
                              endIcon={<IconChevronRight />}
                              sx={{
                                bgcolor: "#4f46e5",
                                borderRadius: 2,
                                px: 3,
                                textTransform: "none",
                                fontWeight: 700,
                                "&:hover": { bgcolor: "#4338ca" },
                              }}
                            >
                              Express Interest
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))
                  ) : (
                    <Box sx={{ textAlign: "center", py: 10 }}>
                      <Typography color="textSecondary">
                        No openings matching your search.
                      </Typography>
                    </Box>
                  )}

                  {totalPages > 1 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mt: 4 }}
                    >
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, v) => setPage(v)}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </Stack>
              </motion.div>
            ) : (
              <motion.div
                key="apply-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 6 },
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {!formSubmitted ? (
                    <>
                      <Button
                        startIcon={<IconArrowLeft />}
                        onClick={() => setSelectedOpening(null)}
                        sx={{ color: "#64748b", mb: 4, textTransform: "none" }}
                      >
                        Back to All Openings
                      </Button>

                      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                        Interest in {selectedOpening.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#64748b", mb: 5 }}
                      >
                        Position at{" "}
                        <strong>{selectedOpening.company?.name}</strong>.
                        Provide your details for the placement coordinator.
                      </Typography>

                      <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="Full Name"
                              required
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="CADER Student ID / Email"
                              required
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="Current CGPA / Grade"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              select
                              label="Preferred Start Date"
                              defaultValue="immediate"
                              variant="outlined"
                            >
                              <MenuItem value="immediate">Immediate</MenuItem>
                              <MenuItem value="next-month">Next Month</MenuItem>
                              <MenuItem value="quarter">Next Quarter</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              label="Portfolio Link (Surveying/Design)"
                              placeholder="Behance, GitHub, or Drive link"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Brief Technical Summary"
                              placeholder="Mention your expertise in total station, AutoCAD, etc."
                              variant="outlined"
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Box
                              sx={{
                                p: 4,
                                border: "2px dashed #cbd5e1",
                                borderRadius: 4,
                                textAlign: "center",
                                bgcolor: "#f8fafc",
                                cursor: "pointer",
                                transition: "0.2s",
                                "&:hover": {
                                  borderColor: "#4f46e5",
                                  bgcolor: "#f3f4ff",
                                },
                              }}
                            >
                              <IconUpload />
                              <Typography
                                variant="h6"
                                sx={{
                                  fontSize: "1rem",
                                  fontWeight: 700,
                                  mt: 1,
                                }}
                              >
                                Attach Professional Resume
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#94a3b8" }}
                              >
                                PDF preferred (max 5MB)
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Button
                              type="submit"
                              fullWidth
                              variant="contained"
                              size="large"
                              sx={{
                                py: 2,
                                bgcolor: "#4f46e5",
                                borderRadius: 3,
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                textTransform: "none",
                                mt: 2,
                                "&:hover": { bgcolor: "#4338ca" },
                              }}
                            >
                              Submit to Placement Cell
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                    </>
                  ) : (
                    <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Box sx={{ color: "#10b981", fontSize: 80 }}>
                          <IconCheckCircle />
                        </Box>
                      </motion.div>
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>
                        Interest Recorded!
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#64748b",
                          textAlign: "center",
                          maxWidth: 450,
                        }}
                      >
                        Your profile has been shared with the placement team at{" "}
                        {selectedOpening.company?.name}. Check your email for
                        further instructions on the interview schedule.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setFormSubmitted(false);
                          setSelectedOpening(null);
                        }}
                        sx={{
                          borderRadius: 2,
                          px: 4,
                          mt: 2,
                          textTransform: "none",
                        }}
                      >
                        Browse Other Placements
                      </Button>
                    </Stack>
                  )}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>
    </>
  );
};

export default Placements;
