import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import { MdAdd } from "react-icons/md";
import { MdLocationOn } from "react-icons/md";
import { MdCalendarToday } from "react-icons/md";

import Sidebar from "../../../components/Sidebar";
import ImageAvatars from "../../../components/ImageAvatar";
import BackgroundImage from "../../../assets/background-img.png";
import logo from "../../../assets/logo/cader_logo.png";
import { motion } from "framer-motion";
import AddNewOpening from "./AddNewOpening";
import AlertDialogSlide from "../../../components/AlertDialogSlide";

// 1. Define Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each card starts 0.1s after the previous one
    },
  },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

const CompanyDashboard = ({ user, data }) => {
  const [openings, setOpenings] = useState([]);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = (newOpening) => {
    if (newOpening) {
      setOpenings((prev) => [...prev, newOpening]);
    }

    setOpen(false);
  };

  const openingAlertData = {
    title: "New Opening",
    description: "",
    content: <AddNewOpening onClose={handleClose} />,
  };

  useEffect(() => {
    if (data) {
      console.log(data.openings);
      setOpenings(data.openings || []);
    }
  }, [data]);

  return (
    <Stack spacing={2} sx={{ userSelect: "none" }} overflow={"hidden"}>
      <AlertDialogSlide
        {...openingAlertData}
        open={open}
        onCancel={handleClose}
      />
      <Stack
        p={2}
        height={"155px"}
        sx={{
          position: "relative",
          background:
            "linear-gradient(217.64deg, #0A3BAF -5.84%, #0025A0 106.73%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            // backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "200%",
            backgroundPosition: "center",
            opacity: 0.25,
            zIndex: 0,
            height: "60dvh",
            minHeight: "165px",
            width: "100%",
          }}
        ></div>
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          color="white"
          zIndex={2}
        >
          <img src={logo} alt="CADer" style={{ width: "65px" }} />

          <Sidebar />
        </Box>

        <Stack direction={"row"} alignItems={"center"} spacing={1} mt={2}>
          <ImageAvatars
            sx={{
              width: "48px",
              height: "48px",
              backgroundColor: "#fff",
              color: "rgba(40, 151, 255, 1)",
              "& .css-1mo2pzk-MuiSvgIcon-root-MuiAvatar-fallback": {
                width: "60%",
                height: "60%",
              },
            }}
          />

          <Box color="white">
            <Typography fontWeight={700} fontSize="14px">
              Hello,
            </Typography>
            <Typography fontWeight={700} fontSize="14px">
              {user.name}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* --- CONTENT SECTION --- */}
      <Box className="overlapping-header" sx={{ px: 2, pb: 4 }}>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"flex-end"}
          mb={3}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#1a202c" }}>
              Active Job Openings
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You have {openings?.length || 0} live listings
            </Typography>
          </Box>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="contained"
            startIcon={<MdAdd size={20} />}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              px: 3,
              bgcolor: "#0A3BAF",
            }}
            onClick={handleOpen}
          >
            New Opening
          </Button>
        </Stack>

        {/* 2. Wrap Grid in motion.div for the entrance stagger */}
        <motion.div variants={containerVariants} animate="visible">
          <Grid container spacing={2.5}>
            {openings?.map((job) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={job._id}>
                {/* 3. Wrap each card in motion.div */}
                <motion.div variants={cardVariants}>
                  <Card
                    component={motion.div}
                    whileHover={{
                      y: -5,
                      boxShadow: "0px 12px 30px rgba(0,0,0,0.1)",
                      borderColor: "#0A3BAF",
                    }}
                    sx={{
                      borderRadius: 4,
                      cursor: "pointer",
                      border: "1px solid #f0f0f0",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        height: "60%",
                        width: "4px",
                        backgroundColor: "#0A3BAF",
                        borderRadius: "0 4px 4px 0",
                      },
                    }}
                  >
                    <CardContent sx={{ p: "20px !important" }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={2}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ color: "#2d3748", fontSize: "1rem" }}
                          >
                            {job.title}
                          </Typography>

                          <Stack direction="row" spacing={3} mt={1}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.5}
                            >
                              <MdLocationOn style={{ color: "#718096" }} />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {job.location}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.5}
                            >
                              <MdCalendarToday
                                style={{ color: "#718096", fontSize: 14 }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {new Date(job.deadline)?.toLocaleDateString(
                                  "en-IN",
                                )}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Stack direction="row" spacing={1} mt={2}>
                            {job.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  bgcolor: "#F0F7FF",
                                  color: "#0A3BAF",
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>

                        <Stack
                          direction="column"
                          alignItems={{ xs: "flex-start", sm: "flex-end" }}
                          spacing={1}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={800}
                            color="success.main"
                          >
                            {job.stipend}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: "8px",
                              textTransform: "none",
                              color: "#4A5568",
                            }}
                          >
                            Edit
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Box>
    </Stack>
  );
};

export default CompanyDashboard;
